import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import { requireAdminUser } from "@/lib/server/admin/users";

export type SupportTicketPayload = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "Open" | "Waiting" | "Solved";
  createdAt: string;
  updatedAt: string;
  handle?: string;
  email?: string;
};

type SupportStatus = "OPEN" | "WAITING" | "SOLVED";

function statusLabel(status: SupportStatus): SupportTicketPayload["status"] {
  switch (status) {
    case "OPEN":
      return "Open";
    case "WAITING":
      return "Waiting";
    case "SOLVED":
      return "Solved";
  }
}

function statusValue(status: string): SupportStatus {
  switch (status) {
    case "Open":
    case "OPEN":
      return "OPEN";
    case "Waiting":
    case "WAITING":
      return "WAITING";
    case "Solved":
    case "SOLVED":
      return "SOLVED";
    default:
      throw new Error("Invalid ticket status.");
  }
}

function handleFromUser(user: {
  kickUsername: string | null;
  discordUsername: string | null;
  displayName: string | null;
  email: string | null;
  name: string | null;
} | null) {
  if (!user) return undefined;
  const handle =
    user.kickUsername ??
    user.discordUsername ??
    user.displayName?.replace(/^@/, "") ??
    user.email?.split("@")[0] ??
    user.name ??
    "player";

  return handle.startsWith("@") ? handle : `@${handle}`;
}

function toPayload(ticket: {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: SupportStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    kickUsername: string | null;
    discordUsername: string | null;
    displayName: string | null;
    email: string | null;
    name: string | null;
  } | null;
}): SupportTicketPayload {
  return {
    id: ticket.id,
    subject: ticket.subject,
    category: ticket.category,
    message: ticket.message,
    status: statusLabel(ticket.status),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    handle: handleFromUser(ticket.user ?? null),
    email: ticket.user?.email ?? undefined,
  };
}

function cleanTicketInput(data: {
  category: string;
  subject: string;
  message: string;
}) {
  const category = data.category.trim().slice(0, 40) || "General";
  const subject = data.subject.trim().slice(0, 120);
  const message = data.message.trim().slice(0, 4000);

  if (subject.length < 3) throw new Error("Ticket subject is too short.");
  if (message.length < 10) throw new Error("Ticket message is too short.");

  return { category, subject, message };
}

export async function createSupportTicket(
  sessionToken: string | undefined,
  data: {
    category: string;
    subject: string;
    message: string;
  }
): Promise<SupportTicketPayload> {
  const userId = await getSessionUserId(sessionToken);
  const input = cleanTicketInput(data);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      ...input,
      status: "OPEN",
    },
    include: {
      user: {
        select: {
          kickUsername: true,
          discordUsername: true,
          displayName: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return toPayload(ticket);
}

export async function listMySupportTickets(
  sessionToken: string | undefined
): Promise<SupportTicketPayload[]> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) return [];

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return tickets.map(toPayload);
}

export async function listAdminSupportTickets(
  sessionToken: string | undefined,
  status?: string
): Promise<SupportTicketPayload[]> {
  await requireAdminUser(sessionToken);

  const tickets = await prisma.supportTicket.findMany({
    where: status ? { status: statusValue(status) } : {},
    include: {
      user: {
        select: {
          kickUsername: true,
          discordUsername: true,
          displayName: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return tickets.map(toPayload);
}

export async function updateSupportTicketStatus(
  sessionToken: string | undefined,
  ticketId: string,
  status: string
): Promise<SupportTicketPayload> {
  await requireAdminUser(sessionToken);

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: statusValue(status) },
    include: {
      user: {
        select: {
          kickUsername: true,
          discordUsername: true,
          displayName: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return toPayload(ticket);
}
