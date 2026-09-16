export function challongeSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? null;
  } catch {
    const segments = trimmed.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? null;
  }
}

export function challongeEmbedUrl(value: string | null | undefined): string | null {
  const slug = challongeSlug(value);
  return slug ? `https://challonge.com/${slug}/module?theme=2` : null;
}