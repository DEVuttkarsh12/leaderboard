import { Target, Trophy, Zap } from "lucide-react";

const steps = [
  {
    icon: Target,
    title: "Participate",
    description:
      "Complete activities and take part in the community to start earning.",
  },
  {
    icon: Zap,
    title: "Earn Points",
    description:
      "Build your score through verified actions and consistent engagement.",
  },
  {
    icon: Trophy,
    title: "Rise in Rank",
    description:
      "Move higher on the leaderboard as your score grows over time.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-[#17151f] md:text-4xl">
            How It Works
          </h2>
          <p className="mt-2 text-[#6f6b7a]">
            Three simple steps to climb the rankings.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-2xl border border-[#e8e4f0] bg-[#f8f7fc] p-8 text-center transition-all hover:-translate-y-0.5"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#f2effc]">
                  <Icon className="h-7 w-7 text-[#7257d5]" />
                </div>
                <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#7257d5] text-xs font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[#17151f]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6f6b7a]">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
