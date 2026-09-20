export function challongeSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      (parsed.hostname !== "challonge.com" && !parsed.hostname.endsWith(".challonge.com"))
    ) {
      return null;
    }
    const segments = parsed.pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 1] ?? null;
    return slug && /^[a-zA-Z0-9_-]+$/.test(slug) ? slug : null;
  } catch {
    return /^[a-zA-Z0-9_-]+$/.test(trimmed) ? trimmed : null;
  }
}

export function challongeEmbedUrl(value: string | null | undefined): string | null {
  const slug = challongeSlug(value);
  if (!slug) return null;

  const trimmed = value?.trim() ?? "";
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return `https://challonge.com/${slug}/module?theme=2`;
  }

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return parsed.hostname === "challonge.com"
      ? `https://challonge.com/${slug}/module?theme=2`
      : null;
  } catch {
    return null;
  }
}
