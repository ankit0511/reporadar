import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { WorldMap, ACTIVITY_CITIES } from "@/components/WorldMap";
import { LiveActivityToast } from "@/components/LiveActivityToast";
import { HexagonPattern } from "@/components/HexagonPattern";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:5000";

export function Hero() {
  const [query, setQuery] = useState("");
  const [activeCity, setActiveCity] = useState<
    (typeof ACTIVITY_CITIES)[number] | null
  >(null);

  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      window.location.href = `${API_BASE}/api/auth/github`;
      return;
    }

    navigate(`/dashboard?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <HexagonPattern corner="top-left" />
      {/* World Map (Behind Content) */}
      <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/3 translate-x-0 z-0 pointer-events-none">
        <div className="relative h-100 w-250 opacity-80">
          <WorldMap activeCity={activeCity} />
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-xl">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#C7A862] uppercase mb-6">
            Discover • Connect • Contribute
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-6">
            Find Your Next
            <br />
            <span className="bg-gradient-to-r from-[#C7A862] via-[#E8D9A8] to-[#F5E6B3] bg-clip-text text-transparent">
              Open Source
            </span>
            <br />
            Adventure
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-md">
            AI-powered discovery of open source repositories that match your
            skills and interests.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 rounded-full border border-[#C7A862]/20 bg-neutral-900/90 backdrop-blur-sm pl-5 pr-2 py-2 shadow-lg shadow-[#C7A862]/5 max-w-md"
          >
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search repositories, topics, or technologies..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-200 placeholder:text-neutral-500 py-2"
            />

            <button
              type="submit"
              aria-label="Search"
              className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#F5E6B3] to-[#C7A862] flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4 text-neutral-900" />
            </button>
          </form>
        </div>
      </div>

      {/* Live Activity Toast */}
      {/* Uncomment if needed */}
      {/* <LiveActivityToast onCityChange={setActiveCity} /> */}
    </section>
  );
}

export default Hero;