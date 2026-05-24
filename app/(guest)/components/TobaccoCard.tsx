"use client";

import type { FreshTobacco } from "../_mock-data";
import { CheckIcon, PlusIcon } from "./Icon";
import { StrengthMeter } from "./StrengthMeter";

type Props = {
  item: FreshTobacco;
  added?: boolean;
  onAdd?: () => void;
};

export function TobaccoCard({ item, added = false, onAdd }: Props) {
  return (
    <div
      className="tap flex w-[168px] shrink-0 flex-col overflow-hidden rounded-[14px]"
      style={{
        background: "#161212",
        border: "1px solid rgba(255,255,255,0.05)",
        scrollSnapAlign: "start",
      }}
    >
      {/* Jar illustration */}
      <div
        className="relative h-[140px] overflow-hidden"
        style={{ background: item.bg }}
      >
        <svg viewBox="0 0 120 140" className="absolute inset-0 size-full">
          <defs>
            <linearGradient id={`jar-${item.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
            </linearGradient>
          </defs>
          <rect
            x="32"
            y="40"
            width="56"
            height="80"
            rx="6"
            fill={`url(#jar-${item.id})`}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.8"
          />
          <rect
            x="28"
            y="32"
            width="64"
            height="12"
            rx="2"
            fill="rgba(0,0,0,0.5)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="0.8"
          />
          <rect
            x="38"
            y="62"
            width="44"
            height="38"
            rx="2"
            fill="rgba(0,0,0,0.55)"
            stroke="rgba(255,69,0,0.4)"
            strokeWidth="0.6"
          />
          <text
            x="60"
            y="80"
            textAnchor="middle"
            fill="rgba(255,255,255,0.9)"
            fontFamily="Manrope"
            fontSize="6"
            fontWeight="700"
            letterSpacing="0.5"
          >
            {item.brand.toUpperCase()}
          </text>
          <text
            x="60"
            y="92"
            textAnchor="middle"
            fill="rgba(255,180,120,0.7)"
            fontFamily="Manrope"
            fontSize="4.2"
            fontWeight="500"
          >
            {item.flavor}
          </text>
        </svg>

        {/* "Нове" badge */}
        <div
          className="absolute top-2 left-2 rounded px-1.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[1.2px] text-white"
          style={{ background: "rgba(255,69,0,0.92)" }}
        >
          Нове
        </div>

        {/* Add / added button */}
        <button
          type="button"
          onClick={onAdd}
          className="tap absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-[10px] text-white transition-all duration-200"
          style={{
            background: added ? "rgba(255,69,0,0.95)" : "rgba(20,12,12,0.85)",
            border: `1px solid ${added ? "rgba(255,180,120,0.6)" : "rgba(255,255,255,0.12)"}`,
            backdropFilter: "blur(8px)",
            boxShadow: added ? "0 0 14px rgba(255,69,0,0.55)" : undefined,
          }}
          aria-label={added ? "Прибрати з міксу" : "Додати в мікс"}
        >
          {added ? <CheckIcon size={14} /> : <PlusIcon size={16} />}
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 pt-2.5 pb-3">
        <div className="mb-0.5 text-[10px] tracking-[0.4px] text-[#888]">
          {item.brand}
        </div>
        <div className="mb-2 overflow-hidden text-[13px] font-semibold leading-[1.2] text-ellipsis whitespace-nowrap text-white">
          {item.flavor}
        </div>
        <StrengthMeter value={item.strength} tickWidth={10} tickHeight={3} />
      </div>
    </div>
  );
}
