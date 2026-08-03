import { Users } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="leaderboard-shell premium-outline flex flex-col items-center justify-center rounded-[2rem] px-6 py-20 text-center">
      <div className="score-pill mb-5 flex h-16 w-16 items-center justify-center rounded-full">
        <Users className="h-7 w-7 text-[var(--primary-deep)]" />
      </div>
      <h3 className="display-serif text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
        No rankings available yet
      </h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
        Leaderboard entries will appear here once users begin participating.
      </p>
    </div>
  );
}
