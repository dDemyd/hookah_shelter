"use client";

import { useId } from "react";

type StarProps = {
  size?: number;
  filled?: boolean;
  half?: boolean;
};

function Star({ size = 18, filled = false, half = false }: StarProps) {
  const gradId = `star-half-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {half ? (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="50%" stopColor="#ff8a3d" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.14)" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d="M12 3.8l2.3 5 5.4.7-4 3.8 1 5.4L12 16l-4.8 2.7 1-5.4-4-3.8 5.5-.7L12 3.8Z"
        fill={half ? `url(#${gradId})` : filled ? "#ff8a3d" : "rgba(255,255,255,0.14)"}
        stroke={filled || half ? "#ff8a3d" : "rgba(255,255,255,0.22)"}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Read-only average display (supports half stars).
export function StarRatingDisplay({
  value,
  size = 14,
}: {
  value: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          filled={value >= n}
          half={value >= n - 0.5 && value < n}
        />
      ))}
    </div>
  );
}

// Interactive 1–5 star picker.
export function StarRatingInput({
  value,
  onPick,
  size = 32,
  disabled = false,
}: {
  value: number;
  onPick: (stars: number) => void;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onPick(n)}
          aria-label={`Оцінити на ${n}`}
          aria-pressed={value === n}
          className="tap disabled:opacity-50"
        >
          <Star size={size} filled={value >= n} />
        </button>
      ))}
    </div>
  );
}
