import { MAX_STRENGTH } from "@/lib/constants";

type Props = {
  value: number;
  max?: number;
  /** Width of each "tick" in px — kept for layout compatibility with the
   *  earlier discrete version. Total bar width = tickWidth * max + gap * (max-1). */
  tickWidth?: number;
  tickHeight?: number;
  gap?: number;
  className?: string;
};

/**
 * Continuous fire-orange bar with subtle scale markers.
 *
 * Originally rendered `max` discrete ticks, but bumping the scale to 1..12
 * makes that visually noisy at small sizes. The continuous bar keeps the same
 * footprint at every `max`, so existing card layouts don't change.
 */
export function StrengthMeter({
  value,
  max = MAX_STRENGTH,
  tickWidth = 14,
  tickHeight = 4,
  gap = 4,
  className,
}: Props) {
  const totalWidth = tickWidth * max + gap * Math.max(0, max - 1);
  const pct = Math.max(0, Math.min(1, value / max));
  // 3 internal divider marks at 25/50/75% so the eye still has a sense of
  // scale without rendering every integer tick at high `max`.
  const markPositions = [25, 50, 75];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: totalWidth,
        height: tickHeight,
        borderRadius: tickHeight / 2,
        background: "rgba(255,255,255,0.12)",
        overflow: "hidden",
      }}
      aria-label={`Міцність ${value} з ${max}`}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          background: "linear-gradient(90deg, #ff4500, #ff8a3d)",
          boxShadow: "0 0 6px rgba(255,69,0,0.6)",
        }}
      />
      {markPositions.map((p) => (
        <div
          key={p}
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${p}%`,
            width: 1,
            background: "rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
