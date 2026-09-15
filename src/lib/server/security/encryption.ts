import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ENCRYPTED_PREFIX = "enc:v1";

function encryptionKey() {
  const configuredSecret = process.env.AUTH_ENCRYPTION_KEY?.trim();
  const secret =
    configuredSecret ||
    (process.env.NODE_ENV !== "production"
      ? process.env.KICK_CLIENT_SECRET?.trim() ||
        process.env.DISCORD_CLIENT_SECRET?.trim()
      : undefined);

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Server credential encryption is not configured.");
    }
    return null;
  }

  return createHash("sha256").update(secret).digest();
}

export function isEncryptedServerSecret(value: string | null | undefined) {
  return Boolean(value?.startsWith(`${ENCRYPTED_PREFIX}:`));
}

export function encryptServerSecret(value: string | null | undefined) {
  if (!value) return value;
  if (value.startsWith(`${ENCRYPTED_PREFIX}:`)) return value;

  const key = encryptionKey();
  if (!key) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTED_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptServerSecret(value: string | null | undefined) {
  if (!value || !value.startsWith(`${ENCRYPTED_PREFIX}:`)) return value;

  const key = encryptionKey();
  if (!key) {
    throw new Error("Encrypted server credential cannot be read.");
  }

  const [, , ivValue, tagValue, encryptedValue] = value.split(":");
  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Encrypted server credential is invalid.");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivValue, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Stored account access has expired. Reconnect the provider.");
  }
}
