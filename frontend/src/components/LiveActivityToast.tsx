import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { ACTIVITY_CITIES } from "@/components/WorldMap";

const MESSAGES = [
  "just found a repo to contribute to",
  "just joined RepoRadar",
  "just starred a recommended project",
  "just matched with a beginner-friendly repo",
];

interface LiveActivityToastProps {
  onCityChange: (city: (typeof ACTIVITY_CITIES)[number]) => void;
}

// Placeholder social-proof ticker — swap for a real activity feed later.
// Styled as a map-pin callout (marker + tail + card), sits below the map
// as its own block rather than floating on top of it.
export function LiveActivityToast({ onCityChange }: LiveActivityToastProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    onCityChange(ACTIVITY_CITIES[index % ACTIVITY_CITIES.length]);
  }, [index, onCityChange]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      const timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % ACTIVITY_CITIES.length);
        setVisible(true);
      }, 400);
      return () => clearTimeout(timeout);
    }, 3600);

    return () => clearInterval(interval);
  }, []);

  const city = ACTIVITY_CITIES[index % ACTIVITY_CITIES.length];
  const message = MESSAGES[index % MESSAGES.length];

  return (
    <div
      className={`flex flex-col items-center transition-opacity duration-400 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Pin marker */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5E6B3] to-[#C7A862] flex items-center justify-center shadow-lg shadow-[#C7A862]/20">
        <MapPin className="w-4.5 h-4.5 text-neutral-900" fill="currentColor" />
      </div>

      {/* Tail connecting the pin to the card */}
      <div className="w-3 h-3 bg-[#C7A862] rotate-45 -mt-1.5 -mb-1.5" />

      {/* Callout card */}
      <div className="rounded-xl border border-[#C7A862]/20 bg-neutral-900/90 backdrop-blur-sm px-4 py-2 shadow-lg">
        <p className="text-xs text-neutral-300 text-center whitespace-nowrap">
          <span className="font-medium text-neutral-100">Someone from {city.name}</span>{" "}
          {message}
        </p>
      </div>
    </div>
  );
}

export default LiveActivityToast;
