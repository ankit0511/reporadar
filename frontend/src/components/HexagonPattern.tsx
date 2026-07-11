import { useTheme } from "@/context/ThemeContext";

interface HexagonPatternProps {
  corner: "top-left" | "bottom-right";
}

// Palette (matches Hero.tsx): Background #050505, Primary Line #C7A862,
// Secondary Glow #E8D9A8, Highlight #F5E6B3.
const VIEWBOX = 480;
const HEX_SIZE = 30; // center-to-vertex radius
const COL_SPACING = Math.sqrt(3) * HEX_SIZE;
const ROW_SPACING = HEX_SIZE * 1.5;
const MAX_FADE_DISTANCE = 340;

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i - 90) * Math.PI) / 180;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

// Deterministic pseudo-random jitter (no Math.random) so the cluster reads
// as hand-placed rather than a perfectly uniform grid.
function jitter(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Honeycomb cluster anchored at local (0,0) — dense at the corner, fading
// outward. The wrapper's position + rotation (per corner prop) maps this
// onto the correct on-screen corner.
function buildCluster() {
  const hexes: { cx: number; cy: number; opacity: number; key: string }[] = [];
  const rows = 8;
  const cols = 8;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * COL_SPACING + (row % 2 === 1 ? COL_SPACING / 2 : 0) + HEX_SIZE;
      const cy = row * ROW_SPACING + HEX_SIZE;

      const dist = Math.hypot(cx, cy);
      const falloff = Math.max(0, 1 - dist / MAX_FADE_DISTANCE);
      if (falloff <= 0.05) continue;

      const opacity = Math.min(1, falloff * (0.75 + jitter(row * 31 + col * 7) * 0.5));
      hexes.push({ cx, cy, opacity, key: `${row}-${col}` });
    }
  }

  return hexes;
}

const CLUSTER = buildCluster();

// Dark mode: warm bronze/gold. Light mode: yellow fading to white.
const THEME_COLORS = {
  dark: { stroke: "#C7A862", fillTop: "#E8D9A8", fillBottom: "#050505", fillBottomOpacity: 0.3, glow: "#C7A862" },
  light: { stroke: "#FCD34D", fillTop: "#FDE68A", fillBottom: "#ffffff", fillBottomOpacity: 0.8, glow: "#FEF08A" },
};

export function HexagonPattern({ corner }: HexagonPatternProps) {
  const { resolvedTheme } = useTheme();
  const colors = THEME_COLORS[resolvedTheme];

  const isTopLeft = corner === "top-left";
  const glowId = `hex-glow-${corner}`;
  const fillId = `hex-fill-${corner}`;

  return (
    <div
      className={`pointer-events-none absolute overflow-hidden z-0 w-105 h-105 lg:w-130 lg:h-130 ${
        isTopLeft ? "top-0 left-0" : "bottom-0 right-0 rotate-180"
      }`}
    >
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} width="100%" height="100%">
        <defs>
          {/* Soft ambient glow behind the cluster */}
          <radialGradient
            id={glowId}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform={`translate(0 0) scale(${VIEWBOX})`}
          >
            <stop offset="0%" stopColor={colors.glow} stopOpacity="0.16" />
            <stop offset="50%" stopColor={colors.glow} stopOpacity="0.05" />
            <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
          </radialGradient>

          {/* Shared bevel fill for every hex cell */}
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.fillTop} stopOpacity="0.12" />
            <stop offset="100%" stopColor={colors.fillBottom} stopOpacity={colors.fillBottomOpacity} />
          </linearGradient>
        </defs>

        <rect width={VIEWBOX} height={VIEWBOX} fill={`url(#${glowId})`} />

        {CLUSTER.map((hex) => (
          <polygon
            key={hex.key}
            points={hexPoints(hex.cx, hex.cy, HEX_SIZE)}
            fill={`url(#${fillId})`}
            stroke={colors.stroke}
            strokeWidth="1"
            strokeOpacity={0.35 * hex.opacity}
            opacity={hex.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

export default HexagonPattern;
