import { prisma } from "@/lib/server/db/prisma";
import { getSessionUserId } from "@/lib/server/auth/session";

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
