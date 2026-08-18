import { loadEnvFile } from "node:process";
import { defineConfig, env } from "prisma/config";

try {
  loadEnvFile(".env.local");
} catch {
  // Prisma commands can still run when env vars are supplied by the shell.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
