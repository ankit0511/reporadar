import type { ComponentType } from "react";
import { Sparkles, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  visual: ComponentType;
  title: string;
  description: string;
}

function RadarPingVisual() {
  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <span className="absolute inset-0 rounded-full border-2 border-primary animate-radar-ping" />
      <span className="absolute inset-0 rounded-full border-2 border-primary animate-radar-ping [animation-delay:1.1s]" />
      <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-light to-primary text-primary-foreground shadow-md shadow-primary/30">
        <Sparkles className="w-4 h-4" />
      </span>
    </div>
  );
}

function ScanGridVisual() {
  return (
    <div className="relative w-24 h-16">
      <div className="grid grid-cols-4 grid-rows-3 gap-1.5 w-full h-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="rounded-[3px] bg-border/70" />
        ))}
      </div>
      <span className="absolute w-4 h-4 rounded-[3px] bg-gradient-to-br from-primary-light to-primary shadow-sm shadow-primary/40 animate-scan-move" />
    </div>
  );
}

function PulseZapVisual() {
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <span className="absolute w-10 h-10 rounded-full bg-primary/25 blur-md animate-pulse-glow" />
      <Zap className="relative w-7 h-7 text-primary" fill="hsl(var(--primary))" />
    </div>
  );
}

function SlideDotVisual() {
  return (
    <div className="flex flex-col gap-5 w-28">
      <div className="relative h-1 rounded-full bg-border">
        <span className="absolute -top-1.5 w-3 h-3 rounded-full bg-gradient-to-br from-primary-light to-primary shadow-sm shadow-primary/40 animate-slide-dot" />
      </div>
      <div className="relative h-1 rounded-full bg-border">
        <span className="absolute -top-1.5 w-3 h-3 rounded-full bg-gradient-to-br from-primary-light to-primary shadow-sm shadow-primary/40 animate-slide-dot [animation-delay:0.6s] [animation-direction:reverse]" />
      </div>
    </div>
  );
}

function WaveVisual() {
  return (
    <div className="relative w-28 h-12 overflow-hidden">
      <div className="absolute inset-y-0 left-0 flex w-[200%] animate-wave-scroll">
        {[0, 1].map((copy) => (
          <svg key={copy} viewBox="0 0 112 48" className="w-28 h-12 shrink-0" preserveAspectRatio="none">
            <path
              d="M0 24 Q 14 6 28 24 T 56 24 T 84 24 T 112 24"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="2"
            />
            <path
              d="M0 30 Q 14 16 28 30 T 56 30 T 84 30 T 112 30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

function CycleHighlightVisual() {
  return (
    <div className="flex items-center gap-2.5">
      {[0, 0.25, 0.5, 0.75, 1].map((delay, i) => (
        <span
          key={delay}
          style={{ animationDelay: `${delay}s` }}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full animate-cycle-highlight",
            i === 2 ? "bg-gradient-to-br from-primary-light to-primary" : "bg-secondary"
          )}
        >
          <Users className={i === 2 ? "w-3.5 h-3.5 text-primary-foreground" : "w-3.5 h-3.5 text-muted-foreground"} />
        </span>
      ))}
    </div>
  );
}

const FEATURES: Feature[] = [
  {
    visual: RadarPingVisual,
    title: "AI Repo Matching",
    description: "Get repositories ranked by how well they fit your skills, not just star count.",
  },
  {
    visual: ScanGridVisual,
    title: "Beginner-Friendly Filters",
    description: "Surface issues labeled good-first-issue across languages you already know.",
  },
  {
    visual: PulseZapVisual,
    title: "Real-Time Activity",
    description: "Watch contributions and matches happen live, from developers around the world.",
  },
  {
    visual: SlideDotVisual,
    title: "Skill-Based Recommendations",
    description: "Tell us your stack once — we keep suggesting projects that fit it.",
  },
  {
    visual: WaveVisual,
    title: "Contribution Tracking",
    description: "Keep a history of repos you've starred, forked, and contributed to in one place.",
  },
  {
    visual: CycleHighlightVisual,
    title: "Community Driven",
    description: "Built with feedback from contributors looking for their next open source home.",
  },
];

function FeatureCard({ visual: Visual, title, description, index }: Feature & { index: number }) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30",
        index % 2 === 0 ? "hover:rotate-1" : "hover:-rotate-1"
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />

      <div className="h-24 flex items-center rounded-xl bg-secondary/30 px-4 mb-5">
        <Visual />
      </div>

      <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section className="relative w-screen h-screen shrink-0 snap-start bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="grid lg:grid-cols-[0.7fr_2.3fr] gap-16 items-center w-full">
          {/* Heading, left-most */}
          <div className="relative max-w-md">
            {/* Tilted decorative badge, echoing the contact section's floating cards */}
            <div className="hidden sm:flex absolute -top-14 left-8 rotate-[-6deg] items-center gap-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light to-primary px-4 py-2.5 shadow-xl shadow-primary/20">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground whitespace-nowrap">
                6 ways to find your match
              </span>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs sm:text-sm font-semibold text-muted-foreground mb-5">
              Why RepoRadar
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">
              Everything you need to find your next{" "}
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                contribution
              </span>
            </h2>
            <p className="text-muted-foreground">
              Discovery, filtering, and tracking — built around how contributors
              actually pick projects.
            </p>
          </div>

          {/* Cards, 3x2 grid */}
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureGrid;
