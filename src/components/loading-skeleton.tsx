export function PodiumSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:items-end">
      {[2, 1, 3].map((height) => (
        <div
          key={height}
          className="leaderboard-shell shimmer-panel rounded-[1.8rem] p-6"
          style={{ height: 188 + height * 34 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-[rgba(111,76,209,0.14)]" />
            <div className="flex-1">
              <div className="mb-2 h-3 w-16 rounded-full bg-[rgba(111,76,209,0.14)]" />
              <div className="h-5 w-28 rounded-full bg-[rgba(111,76,209,0.14)]" />
            </div>
          </div>
          <div className="mb-3 h-3 w-20 rounded-full bg-[rgba(111,76,209,0.12)]" />
          <div className="h-8 w-24 rounded-full bg-[rgba(111,76,209,0.14)]" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="leaderboard-shell shimmer-panel flex items-center gap-4 rounded-[1.5rem] p-4"
        >
          <div className="h-11 w-11 rounded-[1rem] bg-[rgba(111,76,209,0.14)]" />
          <div className="h-11 w-11 rounded-full bg-[rgba(111,76,209,0.14)]" />
          <div className="flex-1">
            <div className="mb-2 h-4 w-32 rounded-full bg-[rgba(111,76,209,0.14)]" />
            <div className="h-3 w-24 rounded-full bg-[rgba(111,76,209,0.12)]" />
          </div>
          <div className="h-8 w-24 rounded-full bg-[rgba(111,76,209,0.14)]" />
        </div>
      ))}
    </div>
  );
}
