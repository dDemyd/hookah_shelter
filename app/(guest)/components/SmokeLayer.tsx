"use client";

import { useId } from "react";

type Props = { opacity?: number };

/**
 * Atmospheric smoke + film grain layer. Position the parent `relative` and
 * drop this in as the first child; it covers `inset-0` and ignores pointer events.
 */
export function SmokeLayer({ opacity = 0.5 }: Props) {
  // Unique filter id per instance — without this multiple SmokeLayers on the
  // page would share the same #n filter and SVG turbulence patterns collide.
  const filterId = useId().replace(/:/g, "");

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity }}
      aria-hidden
    >
      <div
        className="animate-smoke-drift absolute"
        style={{
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background:
            "radial-gradient(closest-side, rgba(255,120,40,0.18), transparent 70%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="animate-smoke-drift-reverse absolute"
        style={{
          bottom: "-30%",
          right: "-15%",
          width: "70%",
          height: "70%",
          background:
            "radial-gradient(closest-side, rgba(139,0,0,0.25), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ mixBlendMode: "overlay", opacity: 0.5 }}
      >
        <filter id={`smoke-noise-${filterId}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#smoke-noise-${filterId})`} />
      </svg>
    </div>
  );
}
