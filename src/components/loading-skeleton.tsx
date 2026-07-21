export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-[#e8e4f0] bg-white p-5"
        >
          <div className="mb-2 h-3 w-20 rounded bg-[#e8e4f0]" />
          <div className="h-7 w-24 rounded bg-[#e8e4f0]" />
        </div>
      ))}
    </div>
  );
}

export function PodiumSkeleton() {
  return (
    <div className="flex flex-col items-end justify-center gap-4 md:flex-row md:items-end">
      {[2, 1, 3].map((height) => (
        <div
          key={height}
          className="animate-pulse rounded-2xl border border-[#e8e4f0] bg-white p-6"
          style={{ width: 280, height: 120 + height * 40 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#e8e4f0]" />
            <div className="flex-1">
              <div className="mb-1.5 h-3 w-16 rounded bg-[#e8e4f0]" />
              <div className="h-4 w-24 rounded bg-[#e8e4f0]" />
            </div>
          </div>
          <div className="mb-2 h-3 w-20 rounded bg-[#e8e4f0]" />
          <div className="h-5 w-16 rounded bg-[#e8e4f0]" />
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
          className="animate-pulse flex items-center gap-4 rounded-xl border border-[#e8e4f0] bg-white p-4"
        >
          <div className="h-6 w-8 rounded bg-[#e8e4f0]" />
          <div className="h-10 w-10 rounded-full bg-[#e8e4f0]" />
          <div className="flex-1">
            <div className="mb-1.5 h-4 w-28 rounded bg-[#e8e4f0]" />
            <div className="h-3 w-16 rounded bg-[#e8e4f0]" />
          </div>
          <div className="h-5 w-20 rounded bg-[#e8e4f0]" />
        </div>
      ))}
    </div>
  );
}
