import type { CatalogTobacco } from "../_catalog-data";

type Props = {
  item: CatalogTobacco;
  /** Render dimmed/greyscale (out-of-stock state). */
  dim?: boolean;
};

/**
 * Square tobacco preview. Uses uploaded URL first, then color-driven SVG fallback.
 */
export function TobaccoPhoto({ item, dim = false }: Props) {
  if (item.imageUrl) {
    return (
      <div
        className="relative aspect-square w-full overflow-hidden bg-[#0a0606]"
        style={{
          filter: dim ? "grayscale(0.6) brightness(0.55)" : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={`${item.brand} ${item.flavor}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-square w-full overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 30% 25%, ${item.color}99, ${item.color}44 35%, transparent 70%),
          radial-gradient(circle at 70% 80%, ${item.color}55, transparent 60%),
          linear-gradient(180deg, #1a0e0a 0%, #0a0606 100%)
        `,
        filter: dim ? "grayscale(0.6) brightness(0.55)" : undefined,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id={`pj-${item.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </linearGradient>
        </defs>
        {/* jar body */}
        <rect
          x="56"
          y="58"
          width="88"
          height="118"
          rx="8"
          fill={`url(#pj-${item.id})`}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
        {/* lid */}
        <rect
          x="50"
          y="46"
          width="100"
          height="18"
          rx="3"
          fill="rgba(0,0,0,0.6)"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
        <rect x="50" y="46" width="100" height="4" fill="rgba(255,255,255,0.07)" />
        <circle cx="100" cy="55" r="3" fill={item.color} opacity="0.7" />
        {/* label */}
        <rect
          x="64"
          y="84"
          width="72"
          height="84"
          rx="3"
          fill="rgba(0,0,0,0.62)"
          stroke={`${item.color}66`}
          strokeWidth="0.8"
        />
        <rect x="64" y="84" width="72" height="6" fill={item.color} opacity="0.85" />
        <rect x="64" y="162" width="72" height="6" fill={item.color} opacity="0.4" />
        <text
          x="100"
          y="106"
          textAnchor="middle"
          fill="rgba(255,255,255,0.95)"
          fontFamily="Manrope, sans-serif"
          fontSize="9"
          fontWeight="800"
          letterSpacing="1.2"
        >
          {item.brand.toUpperCase()}
        </text>
        <text
          x="100"
          y="125"
          textAnchor="middle"
          fill="rgba(255,255,255,0.7)"
          fontFamily="Manrope, sans-serif"
          fontSize="6.5"
          fontWeight="500"
        >
          {item.flavor}
        </text>
        <line
          x1="76"
          y1="138"
          x2="124"
          y2="138"
          stroke={item.color}
          strokeWidth="0.8"
          opacity="0.6"
        />
        <text
          x="100"
          y="152"
          textAnchor="middle"
          fill={item.color}
          fontFamily="Manrope, sans-serif"
          fontSize="5.5"
          fontWeight="600"
          opacity="0.9"
        >
          200g · PREMIUM
        </text>
        <ellipse cx="70" cy="100" rx="3" ry="30" fill="rgba(255,255,255,0.08)" />
      </svg>

      {/* Top smoke wisp */}
      <svg
        viewBox="0 0 200 80"
        className="pointer-events-none absolute top-0 left-0 h-[40%] w-full"
        style={{ opacity: 0.4 }}
      >
        <path
          d="M 30 60 Q 60 20 100 50 T 180 30"
          stroke={`${item.color}88`}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          style={{ filter: "blur(6px)" }}
        />
      </svg>
    </div>
  );
}
