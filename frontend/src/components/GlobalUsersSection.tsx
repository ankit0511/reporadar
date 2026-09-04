import { useEffect, useState } from "react";
import { Radar as RadarIcon } from "lucide-react";
import { WorldMap, type MapUser } from "@/components/WorldMap";
import { api } from "@/lib/api";

const ACTIVE_COUNT = 5;

export function GlobalUsersSection() {
  const [users, setUsers] = useState<MapUser[]>([]);

  // Live data only — every pin on the map is a real RepoRadar user with a
  // geocoded GitHub location. No demo/placeholder pins.
  useEffect(() => {
    api
      .get("/api/users/locations")
      .then((data) => {
        const real: MapUser[] = (data.users ?? [])
          .filter((u: any) => typeof u.lat === "number" && typeof u.lng === "number")
          .map((u: any) => ({
            id: u.id,
            name: u.userName,
            avatar: u.avatar ?? null,
            // "Bangalore, India" → "Bangalore" keeps the pin labels short.
            location: (u.location ?? "").split(",")[0].trim(),
            lat: u.lat,
            lng: u.lng,
          }));

        setUsers(real);
      })
      .catch(() => {}); // backend down → map just shows no pins
  }, []);

  const [activeIndices, setActiveIndices] = useState<number[]>([]);

  // Reset the lit-up set whenever the user list changes, then every couple
  // seconds swap one active pin for an idle one — keeps a handful lit at
  // once instead of just one at a time.
  useEffect(() => {
    const count = Math.min(ACTIVE_COUNT, users.length);
    setActiveIndices(Array.from({ length: count }, (_, i) => i));

    const interval = setInterval(() => {
      setActiveIndices((prev) => {
        const idle = users.map((_, i) => i).filter((i) => !prev.includes(i));
        if (idle.length === 0 || prev.length === 0) return prev;

        const swapOutPos = Math.floor(Math.random() * prev.length);
        const swapIn = idle[Math.floor(Math.random() * idle.length)];
        const next = [...prev];
        next[swapOutPos] = swapIn;
        return next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [users]);

  const activeIds = activeIndices.map((i) => users[i]?.id).filter(Boolean) as string[];

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

            <WorldMap users={users} activeIds={activeIds} />

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
