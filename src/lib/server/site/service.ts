import { prisma } from "@/lib/server/db/prisma";

const SITE_BANNER_ID = "default";

export type SiteBannerPayload = {
  announcement: string;
  banner: string;
  promotion: string;
  updatedAt: string;
};

function toSiteBannerPayload(banner: {
  announcement: string;
  banner: string;
  promotion: string;
  updatedAt: Date;
}): SiteBannerPayload {
  return {
    announcement: banner.announcement,
    banner: banner.banner,
    promotion: banner.promotion,
    updatedAt: banner.updatedAt.toISOString(),
  };
}

export async function getSiteBanner(): Promise<SiteBannerPayload> {
  const existing = await prisma.siteBanner.findUnique({ where: { id: SITE_BANNER_ID } });
  const banner = existing ?? await prisma.siteBanner.upsert({
    where: { id: SITE_BANNER_ID },
    create: { id: SITE_BANNER_ID },
    update: {},
  });
  return toSiteBannerPayload(banner);
}

export async function updateSiteBanner(
  input: Pick<SiteBannerPayload, "announcement" | "banner" | "promotion">,
  adminId: string
): Promise<SiteBannerPayload> {
  const banner = await prisma.siteBanner.upsert({
    where: { id: SITE_BANNER_ID },
    create: { id: SITE_BANNER_ID, ...input, updatedById: adminId },
    update: { ...input, updatedById: adminId },
  });
  return toSiteBannerPayload(banner);
}
