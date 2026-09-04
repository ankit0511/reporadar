import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// A person to plot on the map — real users come from /api/users/locations,
// demo users are padded in by GlobalUsersSection while the community is small.
export interface MapUser {
  id: string;
  name: string;
  avatar: string | null;
  location: string;
  lat: number;
  lng: number;
}

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  users: MapUser[];
  // Which users are currently "lit up" with avatar + ping; the rest render
  // as small dots. The parent cycles this set to keep the map feeling live.
  activeIds?: string[];
}

export function WorldMap({ users, activeIds = [] }: WorldMapProps) {
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

      {users.map((user, i) => {
        const active = activeIds.includes(user.id);
        const pingDelay = `${(i % 5) * 0.4}s`;

        return (
          <Marker key={user.id} coordinates={[user.lng, user.lat]}>
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

                {user.avatar ? (
                  <>
                    <defs>
                      <clipPath id={`clip-${user.id}`}>
                        <circle cx={0} cy={0} r={16} />
                      </clipPath>
                    </defs>
                    <image
                      href={user.avatar}
                      x={-16}
                      y={-16}
                      width={32}
                      height={32}
                      clipPath={`url(#clip-${user.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <>
                    <circle r={16} fill="hsl(var(--primary))" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={14}
                      fontWeight={700}
                      fill="hsl(var(--primary-foreground))"
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </text>
                  </>
                )}
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
                  {user.location ? `${user.name} · ${user.location}` : user.name}
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
