import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SignalTone = "acid" | "cyan" | "pink" | "neutral";

export default function SignalChip({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  active = false,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value?: ReactNode;
  tone?: SignalTone;
  active?: boolean;
  className?: string;
}) {
  const iconOnly = value === undefined || value === null || value === "";

  return (
    <span
      className={cn(
        "signal-chip",
        `signal-chip--${tone}`,
        iconOnly && "signal-chip--icon-only",
        active && "signal-chip--active",
        className
      )}
      aria-label={label}
      title={label}
    >
      <Icon size={15} strokeWidth={2.8} aria-hidden="true" />
      {!iconOnly ? <b>{value}</b> : null}
    </span>
  );
}
