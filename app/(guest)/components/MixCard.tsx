"use client";

import Link from "next/link";
import type { PresetMix } from "../presets/preset-data";
import { SmokeLayer } from "./SmokeLayer";
import { StrengthMeter } from "./StrengthMeter";

export function MixCard({ mix }: { mix: PresetMix }) {
  return (
    <Link
      href={`/presets/${mix.id}`}
      className="tap relative block h-[320px] w-[240px] shrink-0 overflow-hidden rounded-[18px] text-left text-white"
      style={{
        background: mix.accent,
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        scrollSnapAlign: "start",
      }}
    >
      {mix.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mix.imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-55"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/62" />
      <SmokeLayer opacity={0.85} />
      {mix.isMixOfDay ? (
        <div className="absolute top-3 left-3 rounded px-2 py-1 text-[9px] font-bold tracking-[1.2px] text-white uppercase backdrop-blur"
          style={{
            background: "rgba(255,69,0,0.92)",
            boxShadow: "0 0 14px rgba(255,69,0,0.35)",
          }}
        >
          Мікс дня
        </div>
      ) : null}

      {/* Smoke wisp */}
      <svg
        viewBox="0 0 240 200"
        className="pointer-events-none absolute top-[30px] -left-[20px] h-[220px] w-[110%]"
        style={{ opacity: 0.4 }}
      >
        <defs>
          <linearGradient id={`wisp-${mix.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M30 160 C 60 100, 100 140, 130 80 S 200 60, 220 20"
          stroke={`url(#wisp-${mix.id})`}
          strokeWidth="40"
          fill="none"
          strokeLinecap="round"
          style={{ filter: "blur(8px)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col justify-end p-[18px]">
        <div className="mb-1.5 font-display text-[30px] font-semibold leading-none tracking-[0.2px]">
          {mix.name}
        </div>
        <div
          className="mb-3.5 h-[34px] text-[12.5px] leading-[1.35]"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {mix.desc}
        </div>

        <div
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-t pt-3.5"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="min-w-0">
            <div className="mb-1 text-[9px] uppercase tracking-[1.5px] text-[#888]">
              Міцність
            </div>
            <StrengthMeter value={mix.strength} tickWidth={6} tickHeight={4} gap={3} />
          </div>
          <div className="shrink-0 text-right text-[17px] font-bold tabular-nums text-[#ff4500]">
            {mix.price}
            <span className="text-[12px] opacity-70">₴</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
