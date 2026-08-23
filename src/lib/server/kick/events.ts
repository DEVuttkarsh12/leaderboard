import { prisma } from "@/lib/server/db/prisma";
import {
  KICK_EVENTS_SUBSCRIPTIONS_URL,
  getKickUserAccessToken,
  verifyKickWebhookSignature,
} from "@/lib/server/auth/kick";
import { requireAdminUser } from "@/lib/server/admin/users";

const SUPPORTED_EVENTS = new Set([
  "chat.message.sent",
  "livestream.status.updated",
]);

type KickIdentity = {
  user_id?: number | string | null;
  username?: string | null;
  channel_slug?: string | null;
};

type KickChatPayload = {
  message_id?: string;
  content?: string;
  created_at?: string;
  sender?: KickIdentity | null;
  broadcaster?: KickIdentity | null;
};

type KickLivestreamPayload = {
  broadcaster?: KickIdentity | null;
  is_live?: boolean;
  status?: string;
  title?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string | null;
};

function cleanUsername(value: string | null | undefined) {
  return value?.trim().replace(/^@+/, "").toLowerCase() ?? "";
}

function dateFrom(value: string | null | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function channelSlugFrom(payload: {
  broadcaster?: KickIdentity | null;
  channel_slug?: string | null;
}) {
  return cleanUsername(payload.broadcaster?.channel_slug ?? payload.channel_slug);
}

async function storeChatMessage(payload: KickChatPayload) {
  const messageId = payload.message_id?.trim();
  const sender = payload.sender;
  const kickUserId = sender?.user_id ? String(sender.user_id) : "";
  const username = cleanUsername(sender?.username);
  const channelSlug = channelSlugFrom(payload);

  if (!messageId || !kickUserId || !username || !channelSlug) {
    throw new Error("Kick chat payload missing required identity fields.");
  }

  await prisma.kickChatActivity.upsert({
    where: { messageId },
    create: {
      messageId,
      kickUserId,
      username,
      channelSlug,
      content: payload.content?.slice(0, 4000) ?? "",
      createdAt: dateFrom(payload.created_at),
    },
    update: {},
  });
}

async function storeLivestreamStatus(payload: KickLivestreamPayload) {
  const channelSlug = channelSlugFrom(payload);
  if (!channelSlug) {
    throw new Error("Kick livestream payload missing broadcaster channel.");
  }

  const normalizedStatus = payload.status?.trim().toLowerCase();
  const isLive =
    typeof payload.is_live === "boolean"
      ? payload.is_live
      : normalizedStatus === "live" || normalizedStatus === "started";
  const eventDate = dateFrom(payload.created_at ?? payload.started_at ?? payload.ended_at);

  await prisma.kickStreamStatus.upsert({
    where: { channelSlug },
    create: {
      channelSlug,
      broadcasterKickId: payload.broadcaster?.user_id ? String(payload.broadcaster.user_id) : null,
      broadcasterUsername: cleanUsername(payload.broadcaster?.username) || null,
      isLive,
      title: payload.title ?? null,
      startedAt: isLive ? dateFrom(payload.started_at ?? payload.created_at) : null,
      endedAt: isLive ? null : dateFrom(payload.ended_at ?? payload.created_at),
      lastEventAt: eventDate,
    },
    update: {
      broadcasterKickId: payload.broadcaster?.user_id ? String(payload.broadcaster.user_id) : undefined,
      broadcasterUsername: cleanUsername(payload.broadcaster?.username) || undefined,
      isLive,
      title: payload.title ?? undefined,
      startedAt: isLive ? dateFrom(payload.started_at ?? payload.created_at) : undefined,
      endedAt: isLive ? null : dateFrom(payload.ended_at ?? payload.created_at),
      lastEventAt: eventDate,
    },
  });
}

export async function ingestKickWebhook(headers: Headers, rawBody: string) {
  const eventType = headers.get("Kick-Event-Type") ?? "";
  if (!SUPPORTED_EVENTS.has(eventType)) {
    return { ok: true, ignored: true };
  }

  const verified = await verifyKickWebhookSignature(headers, rawBody);
  if (!verified) {
    throw new Error("Kick webhook signature verification failed.");
  }

  const payload = JSON.parse(rawBody) as KickChatPayload | KickLivestreamPayload;

  if (eventType === "chat.message.sent") {
    await storeChatMessage(payload as KickChatPayload);
  }

  if (eventType === "livestream.status.updated") {
    await storeLivestreamStatus(payload as KickLivestreamPayload);
  }

  return { ok: true, ignored: false };
}

export async function adminSubscribeKickEvents(sessionToken: string | undefined) {
  const admin = await requireAdminUser(sessionToken);
  const webhookUrl = process.env.KICK_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    throw new Error("KICK_WEBHOOK_URL is not configured.");
  }

  const accessToken = await getKickUserAccessToken(admin.id);
  const results = [];

  for (const event of SUPPORTED_EVENTS) {
    const response = await fetch(KICK_EVENTS_SUBSCRIPTIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events: [{ name: event, version: 1 }],
        method: "webhook",
      }),
    });

    const body = await response.text();
    results.push({
      event,
      ok: response.ok,
      status: response.status,
      body: body.slice(0, 500),
    });
  }

  return results;
}
