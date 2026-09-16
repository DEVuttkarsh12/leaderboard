CREATE TABLE "SiteBanner" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "announcement" TEXT NOT NULL DEFAULT '',
  "banner" TEXT NOT NULL DEFAULT '',
  "promotion" TEXT NOT NULL DEFAULT '',
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteBanner_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SiteBanner" (
  "id",
  "announcement",
  "banner",
  "promotion",
  "updatedAt"
) VALUES ('default', '', '', '', CURRENT_TIMESTAMP);