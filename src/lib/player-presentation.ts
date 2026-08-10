const toneSequence = [
  "orange",
  "violet",
  "cream",
  "coral",
  "blue",
  "pink",
  "green",
] as const;

export type PlayerTone = (typeof toneSequence)[number];

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "RB";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getToneByIndex(index: number): PlayerTone {
  return toneSequence[index % toneSequence.length];
}

function maskToken(token: string): string {
  const clean = token.trim();

  if (!clean) return "";
  if (clean.length <= 2) return `${clean[0] ?? ""}.`;
  if (clean.length <= 4) return `${clean[0]}...${clean.at(-1)}`;

  return `${clean.slice(0, 2)}...${clean.at(-1)}`;
}

export function maskPlayerName(name: string | null | undefined): string {
  const clean = name?.trim();

  if (!clean) return "Hidden player";

  return clean
    .split(/\s+/)
    .filter(Boolean)
    .map(maskToken)
    .join(" ");
}

export function maskPlayerHandle(handle: string | null | undefined): string {
  const clean = handle?.trim().replace(/^@+/, "");

  if (!clean) return "Masked competitor";

  return `@${maskToken(clean)}`;
}
