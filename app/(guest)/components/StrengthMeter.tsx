import { MIX_MAX_STRENGTH } from "@/lib/constants";

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
 * Discrete fire-orange strength scale. `max` is intentionally explicit at
 * call sites where tobacco and mix scales differ.
 */
export function StrengthMeter({
  value,
  max = MIX_MAX_STRENGTH,
  tickWidth = 12,
  tickHeight = 4,
  gap = 4,
  className,
}: Props) {
  const totalWidth = tickWidth * max + gap * Math.max(0, max - 1);
  const activeTicks = Math.max(0, Math.min(max, Math.round(value)));
  const ticks = Array.from({ length: max }, (_, index) => index);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap,
        width: totalWidth,
        height: tickHeight,
      }}
      aria-label={`Міцність ${value} з ${max}`}
    >
      {ticks.map((tick) => (
        <div
          key={tick}
          aria-hidden
          style={{
            width: tickWidth,
            height: tickHeight,
            borderRadius: tickHeight / 2,
            background:
              tick < activeTicks
                ? "linear-gradient(90deg, #ff4500, #ff8a3d)"
                : "rgba(255,255,255,0.12)",
            boxShadow: tick < activeTicks ? "0 0 6px rgba(255,69,0,0.45)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
