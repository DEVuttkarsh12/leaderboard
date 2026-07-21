export function formatNumberCompact(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  }
  return value.toFixed(0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatLastUpdated(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  }).format(date);
}
