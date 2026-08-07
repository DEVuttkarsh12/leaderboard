import { Users } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title = "No rankings available yet",
  description = "Leaderboard entries will appear here once users begin participating.",
  action,
}: EmptyStateProps) {
  return (
    <div className="product-empty-state">
      <div className="empty-stack" aria-hidden="true">
        <i />
        <i />
        <i>
          <Users className="h-5 w-5 text-[var(--orange)]" />
        </i>
      </div>
      <strong>{title}</strong>
      <p>{description}</p>
      {action ?? null}
    </div>
  );
}
