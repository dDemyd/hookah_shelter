type Props = {
  value: number;
  max?: number;
  /** Width of each tick in px. */
  tickWidth?: number;
  tickHeight?: number;
  gap?: number;
  className?: string;
};

/**
 * Fire-orange ticks (filled) on a faint dim background (empty).
 * Spec calls this "StrengthMeter"; design file used "StrengthBar" — same thing.
 */
export function StrengthMeter({
  value,
  max = 5,
  tickWidth = 14,
  tickHeight = 4,
  gap = 4,
  className,
}: Props) {
  return (
    <div className={className} style={{ display: "flex", gap, alignItems: "center" }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return (
          <div
            key={i}
            style={{
              width: tickWidth,
              height: tickHeight,
              borderRadius: 2,
              background: filled
                ? "linear-gradient(90deg, #ff4500, #ff8a3d)"
                : "rgba(255,255,255,0.12)",
              boxShadow: filled ? "0 0 6px rgba(255,69,0,0.6)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
