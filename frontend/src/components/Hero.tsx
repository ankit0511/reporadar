import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Sparkles, Search, ArrowRight, Play, Code2, Terminal, Braces, Cpu, Settings } from "lucide-react";
import { ChatWidget } from "@/components/ChatWidget";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const API_BASE = "http://localhost:5000";

interface FloatingChip {
  icon: LucideIcon;
  className: string;
}

// Ambient "sea of repos" chrome — a handful of floating icon chips scattered
// around the edges, quiet supporting decoration rather than the focal point.
const FLOATING_CHIPS: FloatingChip[] = [
  { icon: Code2, className: "top-24 left-8 lg:left-14" },
  { icon: Cpu, className: "top-1/2 left-4 lg:left-10 -translate-y-1/2" },
  { icon: Terminal, className: "top-32 right-8 lg:right-24" },
  { icon: Braces, className: "top-1/2 right-4 lg:right-12 -translate-y-1/2" },
  { icon: Settings, className: "bottom-16 right-16 lg:right-32" },
];

// Currently unrendered — exported so the build stays green until it's
// either re-added to the Hero layout or deleted for good.
export function FloatingChips() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block">
      {FLOATING_CHIPS.map(({ icon: Icon, className }, i) => (
        <div
          key={i}
          className={`absolute flex items-center justify-center w-14 h-14 rounded-2xl border border-border bg-card shadow-md ${className}`}
        >
          <Icon className="w-5 h-5 text-muted-foreground/70" />
        </div>
      ))}
    </div>
  );
}

// Real social proof from the backend — actual registered-user count and
// real GitHub avatars, no placeholder numbers.
interface UserStats {
  totalUsers: number;
  avatars: string[];
}

export function Hero() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    api
      .get("/api/users/stats")
      .then((data) => setStats(data))
      .catch(() => {}); // backend down → the social-proof row just stays hidden
  }, []);

  const scrollToNext = () => {
    const track = document.getElementById("landing-track");
    track?.scrollTo({ left: track.clientWidth, behavior: "smooth" });
  };

  const handlePrimaryCta = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
      return;
    }
    window.location.href = `${API_BASE}/api/auth/github`;
  };

  return (
    <section className="relative w-screen h-screen shrink-0 snap-start overflow-y-auto bg-background">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-full flex items-center pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
          {/* Chat widget */}
          <div className="group relative flex justify-center lg:justify-center">
            <div className="relative w-full max-w-lg rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 z-10" />
              <ChatWidget />
            </div>
          </div>

          {/* Copy — pushed toward the far right edge of the panel */}
          <div className="max-w-xl ml-auto flex flex-col items-end text-right">
            <span className="inline-flex items-center gap-2 rotate-[-2deg] rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light to-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Discovery
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-foreground mb-6">
              Find Projects
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                You'll Love
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-md mb-8">
              Chat with the RepoRadar assistant about your skills and
              interests, and get repositories matched to you — not just
              sorted by stars.
            </p>

            <div className="flex items-center gap-3 mb-8">
              <Button size="lg" variant="dark"  onClick={handlePrimaryCta}>
                <Search className="w-4 h-4" />
                Find My Repositories
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToNext}>
                <Play className="w-4 h-4" />
                See Demo
              </Button>
            </div>

            {stats && stats.totalUsers > 0 && (
              <div className="flex items-center gap-3">
                {stats.avatars.length > 0 && (
                  <div className="flex -space-x-3">
                    {stats.avatars.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="w-9 h-9 rounded-full border-2 border-background object-cover"
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm text-left">
                  <span className="font-semibold text-primary">
                    Loved by {stats.totalUsers.toLocaleString()} developer{stats.totalUsers === 1 ? "" : "s"}
                  </span>
                  <br />
                  <span className="text-muted-foreground">from around the world</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
