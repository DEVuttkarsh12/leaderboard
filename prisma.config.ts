import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

try {
  loadEnvFile(".env.local");
} catch {
  // Prisma commands can still run when env vars are supplied by the shell.
}

function normalizeConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString);
    if (
      url.searchParams.get("sslmode") === "require" &&
      !url.searchParams.has("uselibpqcompat")
    ) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

const directUrl = normalizeConnectionString(
  process.env.DIRECT_URL || process.env.DATABASE_URL || ""
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
