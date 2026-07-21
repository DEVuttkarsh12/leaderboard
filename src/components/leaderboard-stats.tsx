import { formatNumber, formatNumberCompact } from "@/lib/formatters";

type LeaderboardStatsProps = {
  total: number;
  highestScore: number;
  averageScore: number;
  lastUpdated: Date | null;
};

export default function LeaderboardStats({
  total,
  highestScore,
  averageScore,
  lastUpdated,
}: LeaderboardStatsProps) {
  const stats = [
    { label: "Total Participants", value: formatNumber(total) },
    { label: "Highest Score", value: formatNumberCompact(highestScore) },
    { label: "Average Score", value: formatNumberCompact(averageScore) },
    {
      label: "Last Updated",
      value: lastUpdated
        ? new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }).format(lastUpdated)
        : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-[#e8e4f0] bg-white p-5"
        >
          <div className="text-xs font-medium uppercase tracking-wider text-[#6f6b7a]">
            {stat.label}
          </div>
          <div className="mt-1.5 text-2xl font-semibold text-[#17151f]">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
