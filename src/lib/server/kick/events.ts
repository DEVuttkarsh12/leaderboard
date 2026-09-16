import { prisma } from "@/lib/server/db/prisma";
import {
  KICK_CHANNELS_URL,
  KICK_EVENTS_SUBSCRIPTIONS_URL,
  getKickAppAccessToken,
  getKickUserAccessToken,
  verifyKickWebhookSignature,
} from "@/lib/server/auth/kick";
import { requireAdminUser } from "@/lib/server/admin/users";
import { isDevAuthEnabled } from "@/lib/server/auth/dev";

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

export type AdminKickStreamPayload = {
  channelSlug: string;
  isLive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  lastEventAt: string | null;
  checkedAt: string | null;
  source: "kick_api" | "webhook";
};

type KickChannelResponse = {
  data?: Array<{
    slug?: string;
    stream?: {
      is_live?: boolean;
      start_time?: string | null;
    } | null;
  }>;
};

const LIVE_STATUS_CACHE_MS = 12_000;
let cachedLiveStatus: {
  channelSlug: string;
  expiresAt: number;
  value: { isLive: boolean; startedAt: Date | null; checkedAt: Date };
} | null = null;
let pendingLiveStatus: Promise<{
  isLive: boolean;
  startedAt: Date | null;
  checkedAt: Date;
}> | null = null;

function cleanUsername(value: string | null | undefined) {
  return value?.trim().replace(/^@+/, "").toLowerCase() ?? "";
}

function dateFrom(value: string | null | undefined) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function optionalKickDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() < 2000
    ? null
    : parsed;
}

function channelSlugFrom(payload: {
  broadcaster?: KickIdentity | null;
  channel_slug?: string | null;
}) {
  return cleanUsername(payload.broadcaster?.channel_slug ?? payload.channel_slug);
}

function configuredWatchChannelSlug() {
  const channelSlug = cleanUsername(process.env.KICK_WATCH_CHANNEL_SLUG);
  if (!channelSlug) {
    throw new Error("KICK_WATCH_CHANNEL_SLUG is not configured.");
  }
  return channelSlug;
}

function adminStreamPayload(stream: {
  channelSlug: string;
  isLive: boolean;
  startedAt: Date | null;
  endedAt: Date | null;
  lastEventAt: Date;
}, checkedAt: Date | null = null, source: AdminKickStreamPayload["source"] = "webhook"): AdminKickStreamPayload {
  return {
    channelSlug: stream.channelSlug,
    isLive: stream.isLive,
    startedAt: stream.startedAt?.toISOString() ?? null,
    endedAt: stream.endedAt?.toISOString() ?? null,
    lastEventAt: stream.lastEventAt.toISOString(),
    checkedAt: checkedAt?.toISOString() ?? null,
    source,
  };
}

async function fetchCurrentKickStream(channelSlug: string) {
  if (
    cachedLiveStatus?.channelSlug === channelSlug &&
    cachedLiveStatus.expiresAt > Date.now()
  ) {
    return cachedLiveStatus.value;
  }

  if (pendingLiveStatus) return pendingLiveStatus;

  pendingLiveStatus = (async () => {
    const accessToken = await getKickAppAccessToken();
    const url = new URL(KICK_CHANNELS_URL);
    url.searchParams.set("slug", channelSlug);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Kick channel status request failed.");
    }

    const payload = (await response.json()) as KickChannelResponse;
    const channel = payload.data?.find(
      (item) => cleanUsername(item.slug) === channelSlug
    );
    if (!channel) {
      throw new Error("Configured Kick channel was not found.");
    }

    const startedAt = optionalKickDate(channel.stream?.start_time);
    const value = {
      isLive: channel.stream?.is_live === true,
      startedAt,
      checkedAt: new Date(),
    };
    cachedLiveStatus = {
      channelSlug,
      expiresAt: Date.now() + LIVE_STATUS_CACHE_MS,
      value,
    };
    return value;
  })();

  try {
    return await pendingLiveStatus;
  } finally {
    pendingLiveStatus = null;
  }
}

export async function getPublicKickStream(): Promise<AdminKickStreamPayload> {
  const channelSlug = configuredWatchChannelSlug();
  const stream = await prisma.kickStreamStatus.findUnique({ where: { channelSlug } });

  try {
    const current = await fetchCurrentKickStream(channelSlug);
    const now = current.checkedAt;
    let stored = stream;

    if (!stream || stream.isLive !== current.isLive) {
      stored = await prisma.kickStreamStatus.upsert({
        where: { channelSlug },
        create: {
          channelSlug,
          isLive: current.isLive,
          startedAt: current.isLive ? current.startedAt ?? now : null,
          endedAt: current.isLive ? null : now,
          lastEventAt: now,
        },
        update: {
          isLive: current.isLive,
          startedAt: current.isLive
            ? current.startedAt ?? stream?.startedAt ?? now
            : stream?.startedAt ?? null,
          endedAt: current.isLive ? null : now,
        },
      });
    }

    if (stored) {
      return adminStreamPayload(
        { ...stored, isLive: current.isLive, startedAt: current.startedAt ?? stored.startedAt },
        current.checkedAt,
        "kick_api"
      );
    }
  } catch {
    // The signed webhook state remains available when Kick's status API is unavailable.
  }

  if (!stream) {
    return {
      channelSlug,
      isLive: false,
      startedAt: null,
      endedAt: null,
      lastEventAt: null,
      checkedAt: null,
      source: "webhook",
    };
  }

  return adminStreamPayload(stream);
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
  const existing = await prisma.kickStreamStatus.findUnique({
    where: { channelSlug },
    select: { lastEventAt: true },
  });
  if (existing && existing.lastEventAt > eventDate) return;

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
  if (channelSlugFrom(payload) !== configuredWatchChannelSlug()) {
    return { ok: true, ignored: true };
  }

  if (eventType === "chat.message.sent") {
    await storeChatMessage(payload as KickChatPayload);
  }

  if (eventType === "livestream.status.updated") {
    await storeLivestreamStatus(payload as KickLivestreamPayload);
  }

  return { ok: true, ignored: false };
}

type KickSubscriptionAdmin = {
  id: string;
  email: string | null;
  kickUsername: string | null;
  kickId: string | null;
};

type KickEventSubscriptionResult = {
  event: string;
  ok: boolean;
  status: number;
  body: string;
};

async function listSubscribedEventNames(accessToken: string, broadcasterUserId: string | null) {
  const subscribed = new Set<string>();

  try {
    const url = new URL(KICK_EVENTS_SUBSCRIPTIONS_URL);
    if (broadcasterUserId) {
      url.searchParams.set("broadcaster_user_id", broadcasterUserId);
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return subscribed;

    const payload = (await response.json()) as { data?: Array<{ event?: string }> };
    for (const item of payload.data ?? []) {
      if (item.event) subscribed.add(item.event);
    }
  } catch {
    // If listing fails we fall through and attempt the subscription.
  }

  return subscribed;
}

async function subscribeKickEventsForAdmin(
  admin: KickSubscriptionAdmin
): Promise<KickEventSubscriptionResult[]> {
  const webhookUrl = process.env.KICK_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    if (isDevAuthEnabled()) {
      return [...SUPPORTED_EVENTS].map((event) => ({
        event,
        ok: true,
        status: 200,
        body: `Local dev subscription simulated for ${admin.email ?? admin.kickUsername ?? admin.id}.`,
      }));
    }

    throw new Error("KICK_WEBHOOK_URL is not configured.");
  }

  let accessToken: string;
  try {
    accessToken = await getKickUserAccessToken(admin.id);
  } catch (error) {
    if (isDevAuthEnabled()) {
      return [...SUPPORTED_EVENTS].map((event) => ({
        event,
        ok: true,
        status: 200,
        body: "Local dev subscription simulated because no live Kick user token is available.",
      }));
    }

    throw error;
  }

  const alreadySubscribed = await listSubscribedEventNames(accessToken, admin.kickId);
  const results: KickEventSubscriptionResult[] = [];

  for (const event of SUPPORTED_EVENTS) {
    if (alreadySubscribed.has(event)) {
      results.push({ event, ok: true, status: 200, body: "Already subscribed" });
      continue;
    }

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

export async function adminSubscribeKickEvents(sessionToken: string | undefined) {
  const admin = await requireAdminUser(sessionToken);
  return subscribeKickEventsForAdmin(admin);
}

export async function ensureKickEventSubscriptionsForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, kickUsername: true, kickId: true, role: true },
  });

  if (!user || user.role !== "ADMIN" || !user.kickId) {
    return null;
  }

  const results = await subscribeKickEventsForAdmin(user);
  return {
    total: results.length,
    failed: results.filter((result) => !result.ok).length,
    alreadySubscribed: results.filter((result) => result.body === "Already subscribed").length,
  };
}
