import type { LucideIcon } from "lucide-react";
import { Code2, Sparkles, Smile } from "lucide-react";

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { icon: Code2, value: "330M+", label: "Repositories Indexed" },
  { icon: Sparkles, value: "AI-Powered", label: "Smart Recommendations" },
  { icon: Smile, value: "Beginner", label: "Friendly Interface" },
];

// Flat-top, pointy-side hexagon — used as the icon badge shape.
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

function StatCard({ icon: Icon, value, label }: Stat) {
  return (
    <div className="group relative rounded-2xl border border-[#C7A862]/15 bg-neutral-900/40 backdrop-blur-sm px-6 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#C7A862]/40 hover:shadow-xl hover:shadow-[#C7A862]/10">
      {/* Animated gradient top edge, lights up on hover */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-0 bg-gradient-to-r from-transparent via-[#F5E6B3] to-transparent transition-all duration-500 group-hover:w-2/3" />

      {/* Hexagon icon badge */}
      <div className="flex justify-center mb-5">
        <div
          className="w-14 h-12 flex items-center justify-center bg-gradient-to-br from-[#F5E6B3] to-[#C7A862] shadow-lg shadow-[#C7A862]/20 transition-transform duration-300 group-hover:scale-105"
          style={{ clipPath: HEX_CLIP }}
        >
          <Icon className="w-5 h-5 text-neutral-900" />
        </div>
      </div>

      <p className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-[#C7A862] via-[#E8D9A8] to-[#F5E6B3] bg-clip-text text-transparent">
        {value}
      </p>
      <p className="text-sm sm:text-base text-muted-foreground">{label}</p>
    </div>
  );
}

export function StatsBar() {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-20">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsBar;
