import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

interface City {
  name: string;
  lat: number;
  lng: number;
}

// Placeholder markers — swap for a real "active users" feed once the backend ships.
export const ACTIVITY_CITIES: City[] = [
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "London", lat: 51.5072, lng: -0.1276 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
];

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export interface ActiveUser {
  cityName: string;
  avatar: string;
  label: string;
}

interface WorldMapProps {
  activeUsers?: ActiveUser[];
}

export function WorldMap({ activeUsers = [] }: WorldMapProps) {
  return (
    <ComposableMap
      projection="geoEqualEarth"
      projectionConfig={{ scale: 175 }}
      width={1200}
      height={400}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="hsl(var(--foreground) / 0.12)"
              stroke="none"
              style={{
                default: { outline: "none" },
                hover: { outline: "none" },
                pressed: { outline: "none" },
              }}
            />
          ))
        }
      </Geographies>

      {ACTIVITY_CITIES.map((city, i) => {
        const active = activeUsers.find((u) => u.cityName === city.name);
        const pingDelay = `${(i % 5) * 0.4}s`;

        return (
          <Marker key={city.name} coordinates={[city.lng, city.lat]}>
            {active ? (
              <>
                <circle r={18} fill="hsl(var(--primary))" opacity={0.3}>
                  <animate
                    attributeName="r"
                    values="12;26;12"
                    dur="2s"
                    begin={pingDelay}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.45;0;0.45"
                    dur="2s"
                    begin={pingDelay}
                    repeatCount="indefinite"
                  />
                </circle>

                <defs>
                  <clipPath id={`clip-${city.name}`}>
                    <circle cx={0} cy={0} r={16} />
                  </clipPath>
                </defs>
                <image
                  href={active.avatar}
                  x={-16}
                  y={-16}
                  width={32}
                  height={32}
                  clipPath={`url(#clip-${city.name})`}
                  preserveAspectRatio="xMidYMid slice"
                />
                <circle r={16} fill="none" stroke="hsl(var(--card))" strokeWidth={2.5} />

                <text
                  y={40}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="hsl(var(--foreground))"
                  stroke="hsl(var(--card))"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {active.label}
                </text>
              </>
            ) : (
              <circle r={4} fill="hsl(var(--primary))" opacity={0.5} />
            )}
          </Marker>
        );
      })}
    </ComposableMap>
  );
}

export default WorldMap;
