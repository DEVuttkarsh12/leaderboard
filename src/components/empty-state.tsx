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
    <div className="leaderboard-shell premium-outline flex flex-col items-center justify-center rounded-[2rem] px-6 py-20 text-center">
      <div className="score-pill mb-5 flex h-16 w-16 items-center justify-center rounded-full">
        <Users className="h-7 w-7 text-[var(--primary-deep)]" />
      </div>
      <h3 className="display-serif text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}
