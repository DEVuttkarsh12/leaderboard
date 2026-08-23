import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";
import { requireAdminUser } from "@/lib/server/admin/users";

export type StoreItemPayload = {
  id: string;
  title: string;
  description: string;
  cost: number;
  tag: string;
  stock: number;
  unlimited: boolean;
  imageLabel: string;
};

export type StorePurchasePayload = {
  id: string;
  itemId: string;
  itemTitle: string;
  cost: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
};

export type AdminStorePurchasePayload = StorePurchasePayload & {
  userId: string;
  userHandle: string;
  userEmail: string;
};

const DEFAULT_ITEMS = [
  { title: "Cash Tip", description: "Manual payout direct to you.", cost: 12000, tag: "Cash", stock: 8, unlimited: false, imageLabel: "TIP" },
  { title: "VIP Role", description: "Flex your VIP status on Discord.", cost: 6500, tag: "Role", stock: 999, unlimited: true, imageLabel: "VIP" },
  { title: "Bonus Buy", description: "We buy a bonus live on stream for you.", cost: 18000, tag: "Casino", stock: 3, unlimited: false, imageLabel: "BUY" },
  { title: "Gift Card", description: "Digital gift card code drop.", cost: 22000, tag: "Gift", stock: 5, unlimited: false, imageLabel: "CARD" },
  { title: "Merch Entry", description: "Enter the merch gear draw.", cost: 4000, tag: "Merch", stock: 40, unlimited: false, imageLabel: "DROP" },
  { title: "Steam Key", description: "Random Steam game key.", cost: 8500, tag: "Key", stock: 12, unlimited: false, imageLabel: "KEY" },
];

async function seedItemsIfEmpty(): Promise<void> {
  const count = await prisma.storeItem.count({ where: { active: true } });
  if (count > 0) return;
  await prisma.storeItem.createMany({ data: DEFAULT_ITEMS.map((i) => ({ ...i, active: true })) });
}

export async function listStoreItems(): Promise<StoreItemPayload[]> {
  await seedItemsIfEmpty();
  const items = await prisma.storeItem.findMany({ where: { active: true }, orderBy: { createdAt: "asc" } });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    cost: item.cost,
    tag: item.tag,
    stock: item.stock,
    unlimited: item.unlimited,
    imageLabel: item.imageLabel,
  }));
}

export async function redeemStoreItem(
  sessionToken: string | undefined,
  itemId: string
): Promise<{ purchase: StorePurchasePayload; newPoints: number }> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to redeem store items.");

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.storeItem.findUnique({ where: { id: itemId } });
    if (!item || !item.active) throw new Error("Item not found.");
    if (!item.unlimited && item.stock <= 0) throw new Error("This item is sold out.");

    const user = await tx.user.findUnique({ where: { id: userId }, select: { points: true } });
    if (!user) throw new Error("Session expired. Sign in again.");
    if (user.points < item.cost) throw new Error("Not enough points.");

    const [updatedUser, purchase] = await Promise.all([
      tx.user.update({
        where: { id: userId },
        data: { points: { decrement: item.cost } },
        select: { points: true },
      }),
      tx.storePurchase.create({
        data: { userId, itemId: item.id, cost: item.cost, status: "PENDING" },
        include: { item: { select: { title: true } } },
      }),
      tx.pointTransaction.create({
        data: {
          userId,
          amount: -item.cost,
          reason: "store_purchase",
          meta: JSON.stringify({ itemId: item.id, itemTitle: item.title }),
        },
      }),
      ...(!item.unlimited
        ? [tx.storeItem.update({ where: { id: item.id }, data: { stock: { decrement: 1 } } })]
        : []),
    ]);

    return { updatedUser, purchase };
  });

  return {
    purchase: {
      id: result.purchase.id,
      itemId: result.purchase.itemId,
      itemTitle: result.purchase.item.title,
      cost: result.purchase.cost,
      status: result.purchase.status,
      createdAt: result.purchase.createdAt.toISOString(),
    },
    newPoints: result.updatedUser.points,
  };
}

export async function listUserPurchases(
  sessionToken: string | undefined
): Promise<StorePurchasePayload[]> {
  const userId = await getSessionUserId(sessionToken);
  if (!userId) throw new Error("Sign in to view purchases.");

  const purchases = await prisma.storePurchase.findMany({
    where: { userId },
    include: { item: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return purchases.map((p) => ({
    id: p.id,
    itemId: p.itemId,
    itemTitle: p.item.title,
    cost: p.cost,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));
}

function handleFromUser(user: {
  kickUsername: string | null;
  discordUsername: string | null;
  displayName: string | null;
  email: string | null;
  name: string | null;
}) {
  const handle =
    user.kickUsername ??
    user.discordUsername ??
    user.displayName?.replace(/^@/, "") ??
    user.email?.split("@")[0] ??
    user.name ??
    "player";

  return handle.startsWith("@") ? handle : `@${handle}`;
}

function storeItemPayload(item: {
  id: string;
  title: string;
  description: string;
  cost: number;
  tag: string;
  stock: number;
  unlimited: boolean;
  imageLabel: string;
}): StoreItemPayload {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    cost: item.cost,
    tag: item.tag,
    stock: item.stock,
    unlimited: item.unlimited,
    imageLabel: item.imageLabel,
  };
}

export async function adminCreateStoreItem(
  sessionToken: string | undefined,
  data: {
    title: string;
    description?: string;
    cost: number;
    tag?: string;
    stock: number;
    unlimited?: boolean;
    imageLabel?: string;
  }
): Promise<StoreItemPayload> {
  await requireAdminUser(sessionToken);

  const title = data.title.trim().slice(0, 80);
  if (!title) throw new Error("Store item title is required.");
  if (!Number.isInteger(data.cost) || data.cost < 0 || data.cost > 100_000_000) {
    throw new Error("Enter a valid item cost.");
  }
  if (!Number.isInteger(data.stock) || data.stock < 0 || data.stock > 1_000_000) {
    throw new Error("Enter a valid item stock.");
  }

  const item = await prisma.storeItem.create({
    data: {
      title,
      description: data.description?.trim().slice(0, 180) || "Admin reward.",
      cost: data.cost,
      tag: data.tag?.trim().slice(0, 32) || "Reward",
      stock: data.stock,
      unlimited: Boolean(data.unlimited),
      imageLabel: data.imageLabel?.trim().slice(0, 12).toUpperCase() || "NEW",
      active: true,
    },
  });

  return storeItemPayload(item);
}

export async function adminUpdateStoreItem(
  sessionToken: string | undefined,
  itemId: string,
  data: {
    title?: string;
    description?: string;
    cost?: number;
    tag?: string;
    stock?: number;
    unlimited?: boolean;
    active?: boolean;
    imageLabel?: string;
  }
): Promise<StoreItemPayload> {
  await requireAdminUser(sessionToken);

  const item = await prisma.storeItem.update({
    where: { id: itemId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim().slice(0, 80) } : {}),
      ...(data.description !== undefined ? { description: data.description.trim().slice(0, 180) } : {}),
      ...(data.cost !== undefined ? { cost: Math.max(0, Math.min(100_000_000, Math.floor(data.cost))) } : {}),
      ...(data.tag !== undefined ? { tag: data.tag.trim().slice(0, 32) || "Reward" } : {}),
      ...(data.stock !== undefined ? { stock: Math.max(0, Math.min(1_000_000, Math.floor(data.stock))) } : {}),
      ...(data.unlimited !== undefined ? { unlimited: data.unlimited } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.imageLabel !== undefined ? { imageLabel: data.imageLabel.trim().slice(0, 12).toUpperCase() || "NEW" } : {}),
    },
  });

  return storeItemPayload(item);
}

export async function adminListStorePurchases(
  sessionToken: string | undefined
): Promise<AdminStorePurchasePayload[]> {
  await requireAdminUser(sessionToken);

  const purchases = await prisma.storePurchase.findMany({
    include: {
      item: { select: { title: true } },
      user: {
        select: {
          id: true,
          kickUsername: true,
          discordUsername: true,
          displayName: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return purchases.map((purchase) => ({
    id: purchase.id,
    itemId: purchase.itemId,
    itemTitle: purchase.item.title,
    cost: purchase.cost,
    status: purchase.status,
    createdAt: purchase.createdAt.toISOString(),
    userId: purchase.userId,
    userHandle: handleFromUser(purchase.user),
    userEmail: purchase.user.email ?? "",
  }));
}

export async function adminUpdateStorePurchaseStatus(
  sessionToken: string | undefined,
  purchaseId: string,
  status: "PENDING" | "COMPLETED" | "REJECTED"
): Promise<AdminStorePurchasePayload> {
  await requireAdminUser(sessionToken);

  const purchase = await prisma.storePurchase.update({
    where: { id: purchaseId },
    data: { status },
    include: {
      item: { select: { title: true } },
      user: {
        select: {
          id: true,
          kickUsername: true,
          discordUsername: true,
          displayName: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return {
    id: purchase.id,
    itemId: purchase.itemId,
    itemTitle: purchase.item.title,
    cost: purchase.cost,
    status: purchase.status,
    createdAt: purchase.createdAt.toISOString(),
    userId: purchase.userId,
    userHandle: handleFromUser(purchase.user),
    userEmail: purchase.user.email ?? "",
  };
}
