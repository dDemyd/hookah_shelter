"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  min?: number;
  max?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
};

export function StrengthRangeSlider({
  min = 1,
  max = 5,
  value,
  onChange,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<"lo" | "hi" | null>(null);
  const [lo, hi] = value;

  const pctOf = (v: number) => ((v - min) / (max - min)) * 100;

  const apply = useCallback(
    (e: PointerEvent) => {
      if (!dragging.current || !trackRef.current) return;
      const r = trackRef.current.getBoundingClientRect();
      const x = e.clientX - r.left;
      const raw = min + (x / r.width) * (max - min);
      const v = Math.max(min, Math.min(max, Math.round(raw)));
      if (dragging.current === "lo") onChange([Math.min(v, hi), hi]);
      else onChange([lo, Math.max(v, lo)]);
    },
    [hi, lo, min, max, onChange],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) {
        apply(e);
        e.preventDefault();
      }
    };
    const up = () => {
      dragging.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [apply]);

  const startDrag = (which: "lo" | "hi") => (e: React.PointerEvent) => {
    dragging.current = which;
    e.preventDefault();
  };

  return (
    // Inset by 14px on each side so the 24px thumbs at min/max don't bleed
    // into (or past) the card edge. The thumb's `marginLeft: -12` then sits
    // 2px clear of the inset, with the inset itself giving breathing room.
    <div
      ref={trackRef}
      className="relative mt-3 mb-2 h-8 select-none mx-3.5"
      style={{ touchAction: "none" }}
    >
      {/* base rail */}
      <div
        className="absolute top-3.5 right-0 left-0 h-1 rounded-sm"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      {/* active fill */}
      <div
        className="absolute top-3.5 h-1 rounded-sm"
        style={{
          left: `${pctOf(lo)}%`,
          width: `${pctOf(hi) - pctOf(lo)}%`,
          background: "linear-gradient(90deg, #ff8a3d, #ff4500)",
          boxShadow: "0 0 10px rgba(255,69,0,0.5)",
        }}
      />
      {(["lo", "hi"] as const).map((which) => {
        const v = which === "lo" ? lo : hi;
        return (
          <button
            key={which}
            type="button"
            aria-label={which === "lo" ? "Мінімальна міцність" : "Максимальна міцність"}
            onPointerDown={startDrag(which)}
            className="absolute top-1 size-6 rounded-full"
            style={{
              left: `${pctOf(v)}%`,
              marginLeft: -12,
              background: "#fff",
              border: "2px solid #ff4500",
              boxShadow:
                "0 0 0 4px rgba(255,69,0,0.2), 0 4px 8px rgba(0,0,0,0.4)",
            }}
          />
        );
      })}
    </div>
  );
}
