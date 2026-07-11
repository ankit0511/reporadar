import { useTheme } from "@/context/ThemeContext";
import worldDots from "@/data/worldDots.json";

interface City {
  name: string;
  lat: number;
  lng: number;
}

// Placeholder markers — swap for a real "active users" feed later.
export const ACTIVITY_CITIES: City[] = [
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "London", lat: 51.5072, lng: -0.1276 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
];

const { width: MAP_WIDTH, height: MAP_HEIGHT, latMin: LAT_MIN, latMax: LAT_MAX, dots } = worldDots;
const LAND_DOTS = dots as [number, number][];

export function projectLatLng(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * MAP_WIDTH;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT;
  return { x, y };
}

// Lighter, subtler gold — the map should sit quietly behind the UI, not compete with it.
const DOT_COLOR = { dark: "#FDE68A", light: "#EAB308" };
const MARKER_COLOR = { dark: "#F5E6B3", light: "#EAB308" };

// Thin the baked dot grid out so the map reads as sparse/subtle rather than dense.
const SPARSE_DOTS = LAND_DOTS.filter((_, i) => i % 4 === 0);

interface WorldMapProps {
  activeCity?: City | null;
}

export function WorldMap({ activeCity }: WorldMapProps) {
  const { resolvedTheme } = useTheme();
  const dotColor = DOT_COLOR[resolvedTheme];
  const markerColor = MARKER_COLOR[resolvedTheme];
  const fadeMaskId = "world-map-fade";

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      width="120%"
      height="100%"
      className="overflow-visible"
    >
      <defs>
        {/* Fully visible from the top edge — only fades out at the bottom. */}
        <linearGradient id={`${fadeMaskId}-gradient`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        <mask id={fadeMaskId}>
          <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill={`url(#${fadeMaskId}-gradient)`} />
        </mask>
      </defs>

      <g mask={`url(#${fadeMaskId})`}>
        {SPARSE_DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.4" fill={dotColor} opacity="0.4" />
        ))}
      </g>

      {ACTIVITY_CITIES.map((city) => {
        const { x, y } = projectLatLng(city.lat, city.lng);
        const isActive = activeCity?.name === city.name;

        return (
          <g key={city.name}>
            {isActive && (
              <circle cx={x} cy={y} r="6" fill={markerColor} opacity="0.35">
                <animate
                  attributeName="r"
                  values="4;14;4"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.5;0;0.5"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            <circle
              cx={x}
              cy={y}
              r={isActive ? 3.5 : 2.5}
              fill={markerColor}
              opacity={isActive ? 1 : 0.6}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default WorldMap;
