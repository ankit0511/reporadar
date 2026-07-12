import { useEffect, useState } from "react";
import { Radar as RadarIcon } from "lucide-react";
import { WorldMap, ACTIVITY_CITIES } from "@/components/WorldMap";

// Dummy social-proof ticker — swap for a real activity feed once the backend ships.
// Paired 1:1 with ACTIVITY_CITIES by index.
const DUMMY_USERS = [
  { name: "Aditi", photo: "https://randomuser.me/api/portraits/women/68.jpg" },
  { name: "Jordan", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
  { name: "Oliver", photo: "https://randomuser.me/api/portraits/men/45.jpg" },
  { name: "Lena", photo: "https://randomuser.me/api/portraits/women/21.jpg" },
  { name: "Wei", photo: "https://randomuser.me/api/portraits/men/76.jpg" },
  { name: "Marina", photo: "https://randomuser.me/api/portraits/women/54.jpg" },
  { name: "Haruto", photo: "https://randomuser.me/api/portraits/men/12.jpg" },
  { name: "Sofia", photo: "https://randomuser.me/api/portraits/women/33.jpg" },
  { name: "Kwame", photo: "https://randomuser.me/api/portraits/men/61.jpg" },
];

const ACTIVE_COUNT = 5;

export function GlobalUsersSection() {
  const [activeIndices, setActiveIndices] = useState<number[]>(() =>
    Array.from({ length: ACTIVE_COUNT }, (_, i) => i)
  );

  // Every couple seconds, swap one of the currently-active pins for one
  // that's sitting idle — keeps exactly ACTIVE_COUNT lit up at once instead
  // of just one at a time.
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndices((prev) => {
        const idle = ACTIVITY_CITIES.map((_, i) => i).filter((i) => !prev.includes(i));
        if (idle.length === 0) return prev;

        const swapOutPos = Math.floor(Math.random() * prev.length);
        const swapIn = idle[Math.floor(Math.random() * idle.length)];
        const next = [...prev];
        next[swapOutPos] = swapIn;
        return next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const activeUsers = activeIndices.map((i) => ({
    cityName: ACTIVITY_CITIES[i].name,
    avatar: DUMMY_USERS[i].photo,
    label: `${DUMMY_USERS[i].name} · ${ACTIVITY_CITIES[i].name}`,
  }));

  return (
    <section className="relative w-screen h-screen shrink-0 snap-start overflow-hidden bg-background">
      <div className="max-w-[145rem] mx-auto h-full flex items-center px-6 lg:px-16">
        <div className="relative flex items-center w-full">

          {/* Heading */}
          <div className="relative z-20 max-w-xl -mr-44 xl:-mr-56">
            <span className="inline-flex items-center gap-2 rotate-[-2deg] rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-light to-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Live Right Now
            </span>

            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-foreground mb-6">
              Developers
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Everywhere
              </span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground max-w-md">
              From Bangalore to São Paulo, contributors are discovering their
              next open source project on RepoRadar — all at once.
            </p>
          </div>

          {/* World Map */}
          <div className="group relative flex-1 aspect-[1/1] rounded-3xl overflow-hidden transition-transform duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 z-10" />

            <WorldMap activeUsers={activeUsers} />

            <span className="absolute top-5 right-5 flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border shadow-lg">
              <RadarIcon className="w-5 h-5 text-primary" />
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}

export default GlobalUsersSection;