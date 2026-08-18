const { loadEnvFile } = require("node:process");
const { Client } = require("pg");

const selectorKeys = ["id", "email", "discord", "kick"];

try {
  loadEnvFile(".env.local");
} catch {
  // The command can still run when DATABASE_URL is supplied by the shell.
}

function usage() {
  console.log(`
Usage:
  npm run admin:list
  npm run admin:promote -- --email player@example.com
  npm run admin:promote -- --discord discord_username
  npm run admin:promote -- --kick kick_username
  npm run admin:promote -- --id user_id
  npm run admin:demote -- --email player@example.com
`);
}

function normalizeConnectionString(connectionString) {
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

function parseCommand(value) {
  if (value === "list" || value === "promote" || value === "demote") {
    return value;
  }

  usage();
  throw new Error("Choose admin:list, admin:promote, or admin:demote.");
}

function parseSelector(args) {
  const found = selectorKeys
    .map((key) => {
      const index = args.indexOf(`--${key}`);
      return index >= 0 ? { key, value: args[index + 1]?.trim() ?? "" } : null;
    })
    .filter(Boolean);

  if (found.length !== 1 || !found[0].value) {
    usage();
    throw new Error("Pass exactly one selector: --email, --discord, --kick, or --id.");
  }

  return found[0];
}

function selectorWhere(selector) {
  if (selector.key === "id") {
    return { sql: `"id" = $2`, value: selector.value };
  }

  if (selector.key === "email") {
    return { sql: `lower("email") = lower($2)`, value: selector.value };
  }

  if (selector.key === "discord") {
    return { sql: `lower("discordUsername") = lower($2)`, value: selector.value };
  }

  return { sql: `lower("kickUsername") = lower($2)`, value: selector.value };
}

function userLabel(user) {
  return [
    user.role.padEnd(6),
    user.id,
    user.email ?? "no-email",
    user.kickUsername ? `kick:${user.kickUsername}` : "kick:-",
    user.discordUsername ? `discord:${user.discordUsername}` : "discord:-",
    user.displayName ? `name:${user.displayName}` : "name:-",
  ].join("  ");
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
    return;
  }

  const command = parseCommand(process.argv[2]);
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Check .env.local.");
  }

  const client = new Client({
    connectionString: normalizeConnectionString(connectionString),
  });

  await client.connect();

  try {
    if (command === "list") {
      const result = await client.query(`
        SELECT
          "id",
          "email",
          "displayName",
          "discordUsername",
          "kickUsername",
          "role"
        FROM "User"
        ORDER BY "role" ASC, "updatedAt" DESC
        LIMIT 50
      `);

      if (!result.rows.length) {
        console.log("No users found.");
        return;
      }

      for (const user of result.rows) {
        console.log(userLabel(user));
      }
      return;
    }

    const selector = parseSelector(process.argv.slice(3));
    const where = selectorWhere(selector);
    const role = command === "promote" ? "ADMIN" : "PLAYER";
    const result = await client.query(
      `
        UPDATE "User"
        SET "role" = $1::"UserRole", "updatedAt" = NOW()
        WHERE ${where.sql}
        RETURNING "id", "email", "role"
      `,
      [role, where.value]
    );

    if (!result.rows.length) {
      throw new Error(`No user found for --${selector.key} ${selector.value}.`);
    }

    const user = result.rows[0];
    console.log(`${user.email ?? user.id} is now ${user.role}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Admin setup failed.");
  process.exitCode = 1;
});
