"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  COOL_MAX_INTENSITY,
  COOL_MIN_INTENSITY,
  MAX_STRENGTH,
  MIN_PERCENT_PER_SLOT,
  type ServiceType,
} from "@/lib/constants";
import { usePublicSettings } from "@/lib/hooks/use-max-ingredients";
import { useMixStore, type MixSlot } from "@/lib/stores/mix-store";
import { calculateStrength } from "@/lib/utils/calculate-strength";
import {
  CATALOG_CATEGORIES,
  fetchCatalogTobaccos,
  TOBACCO_CATALOG,
  type CatalogTobacco,
} from "../catalog/_catalog-data";
import { SmokeLayer } from "../components/SmokeLayer";
import { ChevronIcon, PlusIcon } from "../components/Icon";
import { ServiceSheet } from "../components/ServiceSheet";
import { useDraftsStore } from "@/lib/stores/drafts-store";

type Pick = CatalogTobacco & { pct: number };

function HookahVisualizer({ picks }: { picks: Pick[] }) {
  const total = picks.reduce((sum, pick) => sum + pick.pct, 0);
  const active = picks.length > 0;
  const cavityX = 116;
  const cavityY = 42;
  const cavityW = 48;
  const cavityH = 28;
  const stripes = picks.map((pick, index) => {
    const h = total > 0 ? (pick.pct / 100) * cavityH : 0;
    const previousHeight = picks
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.pct / 100) * cavityH, 0);
    return { ...pick, y: cavityY + cavityH - previousHeight - h, h };
  });
  const dominant =
    picks.length > 0
      ? picks.reduce((a, b) => (a.pct >= b.pct ? a : b)).color
      : null;

  return (
    <div className="relative flex h-[360px] w-full items-end justify-center overflow-visible">
      <div className="pointer-events-none absolute bottom-[-6px] left-1/2 h-[70px] w-[280px] -translate-x-1/2">
        <svg width="100%" height="100%" viewBox="0 0 280 70">
          <defs>
            <radialGradient id="floor-glow" cx="50%" cy="60%" r="55%">
              <stop offset="0%" stopColor="rgba(255,140,80,0.18)" />
              <stop offset="60%" stopColor="rgba(255,69,0,0.06)" />
              <stop offset="100%" stopColor="rgba(255,69,0,0)" />
            </radialGradient>
          </defs>
          <ellipse
            cx="140"
            cy="42"
            rx="120"
            ry="20"
            fill={active ? "url(#floor-glow)" : "rgba(0,0,0,0.5)"}
            style={{ transition: "fill 600ms ease" }}
          />
          <ellipse
            cx="140"
            cy="46"
            rx="60"
            ry="6"
            fill="rgba(0,0,0,0.55)"
            style={{ filter: "blur(2px)" }}
          />
        </svg>
      </div>

      <div
        className="pointer-events-none absolute top-[-20px] left-1/2 h-[130px] w-[240px] -translate-x-1/2"
        style={{
          opacity: active ? 1 : 0,
          transition: "opacity 800ms ease",
        }}
      >
        <SmokeWisps />
      </div>

      {active ? (
        <div className="pointer-events-none absolute top-0 left-1/2 h-[200px] w-[240px] -translate-x-1/2">
          <svg viewBox="0 0 240 200" width="100%" height="100%">
            {[
              { x: 100, delay: 0, r: 1.4 },
              { x: 118, delay: 2.1, r: 1 },
              { x: 140, delay: 1.2, r: 1.6 },
              { x: 158, delay: 3.3, r: 1.1 },
              { x: 110, delay: 4.4, r: 1.2 },
            ].map((ember, index) => (
              <circle
                key={index}
                cx={ember.x}
                cy="40"
                r={ember.r}
                fill="#ffbf80"
                style={{
                  animation: `ember-rise 6s linear ${ember.delay}s infinite`,
                  filter: "blur(0.4px)",
                }}
              />
            ))}
          </svg>
        </div>
      ) : null}

      <svg
        viewBox="0 0 280 460"
        width="220"
        height="362"
        className="relative"
        style={{
          filter: active
            ? "drop-shadow(0 18px 30px rgba(255,69,0,0.16))"
            : "drop-shadow(0 10px 26px rgba(0,0,0,0.6))",
          transition: "filter 600ms ease",
        }}
      >
        <defs>
          <linearGradient id="mn-stem" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#050505" />
            <stop offset="20%" stopColor="#1c1c1c" />
            <stop offset="50%" stopColor="#252525" />
            <stop offset="80%" stopColor="#0e0e0e" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
          <linearGradient id="mn-tray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#383532" />
            <stop offset="40%" stopColor="#2a2826" />
            <stop offset="100%" stopColor="#161412" />
          </linearGradient>
          <linearGradient id="mn-tray-edge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1816" />
            <stop offset="100%" stopColor="#0a0908" />
          </linearGradient>
          <linearGradient id="mn-collar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1c1c" />
            <stop offset="30%" stopColor="#0a0a0a" />
            <stop offset="55%" stopColor="#252525" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
          <linearGradient id="mn-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(180,170,150,0.10)" />
            <stop offset="50%" stopColor="rgba(160,150,130,0.06)" />
            <stop offset="100%" stopColor="rgba(220,200,160,0.12)" />
          </linearGradient>
          <radialGradient id="mn-glass-back" cx="35%" cy="40%" r="80%">
            <stop offset="0%" stopColor="rgba(50,40,30,0.35)" />
            <stop offset="70%" stopColor="rgba(20,16,12,0.55)" />
            <stop offset="100%" stopColor="rgba(8,6,4,0.85)" />
          </radialGradient>
          <linearGradient id="mn-downstem" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a2218" />
            <stop offset="50%" stopColor="#8a6e3a" />
            <stop offset="100%" stopColor="#2a2218" />
          </linearGradient>
          <linearGradient id="mn-clay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a0e08" />
            <stop offset="100%" stopColor="#0a0604" />
          </linearGradient>
          <radialGradient id="mn-coal" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#fff2c8" />
            <stop offset="25%" stopColor="#ffb070" />
            <stop offset="65%" stopColor="#ff4500" />
            <stop offset="100%" stopColor="#2a0a00" stopOpacity="0.9" />
          </radialGradient>
          {dominant ? (
            <linearGradient id="mn-water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`${dominant}00`} />
              <stop offset="60%" stopColor={`${dominant}11`} />
              <stop offset="100%" stopColor={`${dominant}22`} />
            </linearGradient>
          ) : null}
          <clipPath id="mn-cavity">
            <path
              d={`M ${cavityX} ${cavityY}
                     Q ${cavityX} ${cavityY - 2} ${cavityX + 2} ${cavityY - 2}
                     L ${cavityX + cavityW - 2} ${cavityY - 2}
                     Q ${cavityX + cavityW} ${cavityY - 2} ${cavityX + cavityW} ${cavityY}
                     L ${cavityX + cavityW - 4} ${cavityY + cavityH}
                     Q ${cavityX + cavityW - 4} ${cavityY + cavityH + 2} ${cavityX + cavityW - 6} ${cavityY + cavityH + 2}
                     L ${cavityX + 6} ${cavityY + cavityH + 2}
                     Q ${cavityX + 4} ${cavityY + cavityH + 2} ${cavityX + 4} ${cavityY + cavityH} Z`}
            />
          </clipPath>
          <pattern id="mn-hex" x="0" y="0" width="14" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M 7 1 L 13 4.5 L 13 11.5 L 7 15 L 1 11.5 L 1 4.5 Z"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.8"
            />
          </pattern>
          <pattern id="mn-stone" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.4" fill="rgba(255,255,255,0.07)" />
            <circle cx="4" cy="3" r="0.3" fill="rgba(0,0,0,0.4)" />
            <circle cx="2" cy="5" r="0.5" fill="rgba(255,255,255,0.04)" />
          </pattern>
        </defs>

        <g>
          <path
            d="M 108 28 Q 108 24 112 24 L 168 24 Q 172 24 172 28 L 170 32 L 162 74 Q 162 78 158 78 L 122 78 Q 118 78 118 74 L 110 32 Z"
            fill="url(#mn-clay)"
            stroke="rgba(0,0,0,0.7)"
            strokeWidth="0.8"
            style={{ opacity: active ? 1 : 0.7, transition: "opacity 600ms ease" }}
          />
          <rect
            x="109"
            y="28"
            width="62"
            height="1.5"
            fill="rgba(255,255,255,0.06)"
            style={{ opacity: active ? 1 : 0.4, transition: "opacity 600ms ease" }}
          />
          <g clipPath="url(#mn-cavity)">
            <rect x={cavityX} y={cavityY - 2} width={cavityW} height={cavityH + 4} fill="#0a0606" />
            {stripes.map((stripe) => (
              <rect
                key={stripe.id}
                x={cavityX}
                y={stripe.y}
                width={cavityW}
                height={stripe.h}
                fill={stripe.color}
                style={{ transition: "all 400ms cubic-bezier(.2,.7,.2,1)" }}
              />
            ))}
            {active && total > 0 ? (
              <rect
                x={cavityX}
                y={cavityY + cavityH - (total / 100) * cavityH}
                width={cavityW}
                height="2"
                fill="rgba(255,255,255,0.22)"
                style={{ transition: "y 400ms cubic-bezier(.2,.7,.2,1)" }}
              />
            ) : null}
            <circle
              cx={cavityX + cavityW / 2}
              cy={cavityY + cavityH - 4}
              r="2"
              fill="#0a0606"
              stroke="rgba(255,140,80,0.18)"
              strokeWidth="0.5"
            />
          </g>
          <path
            d={`M ${cavityX} ${cavityY} Q ${cavityX} ${cavityY - 2} ${cavityX + 2} ${cavityY - 2}
                    L ${cavityX + cavityW - 2} ${cavityY - 2} Q ${cavityX + cavityW} ${cavityY - 2} ${cavityX + cavityW} ${cavityY}`}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="1.5"
            fill="none"
          />
          <g style={{ opacity: active ? 1 : 0.4, transition: "opacity 600ms ease" }}>
            <ellipse cx="140" cy="24" rx="33" ry="3.5" fill="#3a3a3a" />
            <ellipse cx="140" cy="22" rx="33" ry="3.5" fill="#7a7a7a" />
            <ellipse cx="140" cy="21" rx="31" ry="3" fill="#a0a0a0" />
            <path
              d="M 112 22 L 118 20 L 124 22 L 130 20 L 136 22 L 142 20 L 148 22 L 154 20 L 160 22 L 166 20"
              stroke="rgba(0,0,0,0.25)"
              strokeWidth="0.4"
              fill="none"
            />
            <g
              style={{
                animation: active ? "ember-flicker 2.6s ease-in-out infinite" : "none",
                transformOrigin: "140px 14px",
              }}
            >
              <rect x="118" y="10" width="12" height="12" rx="1.2" fill="url(#mn-coal)" transform="rotate(-6 124 16)" />
              <rect x="133" y="7" width="14" height="14" rx="1.4" fill="url(#mn-coal)" transform="rotate(4 140 14)" />
              <rect x="150" y="10" width="12" height="12" rx="1.2" fill="url(#mn-coal)" transform="rotate(8 156 16)" />
              <path
                d="M 122 14 L 126 18 M 138 12 L 142 16 M 154 14 L 158 18"
                stroke="rgba(255,240,200,0.55)"
                strokeWidth="0.4"
                fill="none"
              />
            </g>
          </g>
        </g>

        <g style={{ opacity: active ? 1 : 0.72, transition: "opacity 600ms ease" }}>
          <rect x="131" y="78" width="18" height="220" fill="url(#mn-stem)" />
          <rect x="131" y="78" width="18" height="220" fill="url(#mn-hex)" />
          <rect x="131" y="78" width="2" height="220" fill="rgba(0,0,0,0.6)" />
          <rect x="147" y="78" width="2" height="220" fill="rgba(0,0,0,0.6)" />
          <rect x="139.4" y="78" width="1.2" height="220" fill="rgba(255,255,255,0.05)" />
        </g>

        <g style={{ opacity: active ? 1 : 0.78, transition: "opacity 600ms ease" }}>
          <ellipse cx="140" cy="86" rx="94" ry="3" fill="url(#mn-tray-edge)" />
          <path
            d="M 48 80 Q 48 78 53 78 L 227 78 Q 232 78 232 80 L 232 81 Q 232 84 227 84 L 53 84 Q 48 84 48 81 Z"
            fill="url(#mn-tray)"
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="0.4"
          />
          <path
            d="M 48 80 Q 48 78 53 78 L 227 78 Q 232 78 232 80 L 232 81 Q 232 84 227 84 L 53 84 Q 48 84 48 81 Z"
            fill="url(#mn-stone)"
            opacity="0.7"
          />
          <path d="M 53 78.4 L 227 78.4" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
          <ellipse cx="140" cy="79.5" rx="5" ry="1" fill="#050403" />
        </g>

        <g style={{ opacity: active ? 1 : 0.72, transition: "opacity 600ms ease" }}>
          <rect
            x="122"
            y="296"
            width="36"
            height="22"
            rx="2.5"
            fill="url(#mn-collar)"
            stroke="rgba(0,0,0,0.8)"
            strokeWidth="0.6"
          />
          <line x1="122" y1="302" x2="158" y2="302" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <line x1="122" y1="302.6" x2="158" y2="302.6" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
          <line x1="122" y1="313" x2="158" y2="313" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <line x1="122" y1="313.6" x2="158" y2="313.6" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
          <text
            x="140"
            y="311.4"
            textAnchor="middle"
            fill="rgba(255,255,255,0.55)"
            fontFamily="Manrope, sans-serif"
            fontSize="5.5"
            fontWeight="800"
            letterSpacing="2"
          >
            MONO
          </text>
          <path d="M 126 318 L 154 318 L 152 324 L 128 324 Z" fill="#0a0a0a" />
          <line x1="131" y1="296" x2="149" y2="296" stroke="rgba(0,0,0,0.7)" strokeWidth="0.5" />
        </g>

        <g style={{ opacity: active ? 1 : 0.85, transition: "opacity 600ms ease" }}>
          <path
            d="M 122 322 L 122 348 C 92 358, 70 388, 70 414 C 70 442, 110 454, 140 454 C 170 454, 210 442, 210 414 C 210 388, 188 358, 158 348 L 158 322 Z"
            fill="url(#mn-glass-back)"
          />
          {dominant ? (
            <path
              d="M 75 396 C 72 420, 100 450, 140 450 C 180 450, 208 420, 205 396 C 195 408, 170 412, 140 412 C 110 412, 85 408, 75 396 Z"
              fill="url(#mn-water)"
              style={{ transition: "fill 500ms ease" }}
            />
          ) : null}
          <path
            d="M 122 322 L 122 348 C 92 358, 70 388, 70 414 C 70 442, 110 454, 140 454 C 170 454, 210 442, 210 414 C 210 388, 188 358, 158 348 L 158 322 Z"
            fill="url(#mn-glass)"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1"
          />
          {active ? (
            <g>
              {[
                { x: 105, delay: 0 },
                { x: 140, delay: 0.6 },
                { x: 175, delay: 1.2 },
                { x: 120, delay: 1.8 },
                { x: 158, delay: 2.4 },
              ].map((bubble, index) => (
                <circle
                  key={index}
                  cx={bubble.x}
                  cy="444"
                  r="2.2"
                  fill="rgba(255,220,180,0.5)"
                  stroke="rgba(255,200,140,0.7)"
                  strokeWidth="0.4"
                  style={{
                    animation: `bubble-up 3.2s ease-in ${bubble.delay}s infinite`,
                  }}
                />
              ))}
            </g>
          ) : null}
          <rect x="138.5" y="324" width="3" height="98" fill="url(#mn-downstem)" />
          <circle cx="140" cy="424" r="2.2" fill="#5a4a28" />
          <ellipse cx="92" cy="400" rx="4" ry="30" fill="rgba(255,255,255,0.14)" />
          <ellipse cx="190" cy="408" rx="3" ry="22" fill="rgba(255,255,255,0.08)" />
          <ellipse cx="140" cy="452" rx="40" ry="4" fill="rgba(255,255,255,0.06)" />
          <rect x="122" y="320" width="36" height="3" fill="rgba(0,0,0,0.5)" />
        </g>
      </svg>

      {!active && (
        <div className="pointer-events-none absolute inset-x-0 top-[130px] text-center">
          <div className="text-[11px] font-bold tracking-[1.8px] text-white/40 uppercase">
            Чаша порожня
          </div>
          <div className="mt-1 text-[10px] text-[#555]">
            додай тютюн, щоб розпалити вогник
          </div>
        </div>
      )}
    </div>
  );
}

function SmokeWisps() {
  const puffs = [
    { x: 96, delay: 0, size: 40 },
    { x: 120, delay: 1.2, size: 54 },
    { x: 144, delay: 0.6, size: 38 },
    { x: 108, delay: 2.1, size: 32 },
    { x: 132, delay: 1.8, size: 36 },
  ];

  return (
    <svg viewBox="0 0 240 160" width="100%" height="100%" className="absolute inset-0">
      <defs>
        <radialGradient id="puff-grad">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="50%" stopColor="rgba(255,180,140,0.18)" />
          <stop offset="100%" stopColor="rgba(255,69,0,0)" />
        </radialGradient>
      </defs>
      {puffs.map((puff, index) => (
        <circle
          key={index}
          cx={puff.x}
          cy="130"
          r={puff.size / 2}
          fill="url(#puff-grad)"
          style={{
            animation: `rise-puff 4.5s ease-out ${puff.delay}s infinite`,
            filter: "blur(3px)",
          }}
        />
      ))}
    </svg>
  );
}

function StatRow({
  label,
  value,
  max,
  icon,
  color,
}: {
  label: string;
  value: number;
  max: number;
  icon: string;
  color: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  // Internal divider marks at quarters so the eye still has a sense of scale
  // without rendering every integer tick (gets visually noisy at max=12).
  const marks = [25, 50, 75];
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="w-[22px] shrink-0 text-center text-[14px]">{icon}</div>
      <div className="w-[88px] shrink-0 text-[12px] font-medium text-[#888]">
        {label}
      </div>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"
        aria-label={`${label} ${value.toFixed(1)} з ${max}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct * 100}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
          }}
        />
        {marks.map((p) => (
          <div
            key={p}
            aria-hidden
            className="absolute top-0 bottom-0"
            style={{
              left: `${p}%`,
              width: 1,
              background: "rgba(0,0,0,0.35)",
            }}
          />
        ))}
      </div>
      <div className="w-[44px] text-right text-[12px] font-bold text-white tabular-nums">
        {value.toFixed(1)}/{max}
      </div>
    </div>
  );
}

function SlotCard({
  pick,
  onPct,
  onRemove,
}: {
  pick: Pick;
  onPct: (pct: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="animate-fade-up flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-[#141010] p-3">
      <div
        className="relative size-11 shrink-0 rounded-[10px]"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${pick.color}, ${pick.color}77 70%, ${pick.color}33)`,
          boxShadow: `0 0 14px ${pick.color}55`,
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-px text-[10px] tracking-[1px] text-[#888] uppercase">
              {pick.brand}
            </div>
            <div className="truncate text-[14px] font-semibold text-white">
              {pick.uname}
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="tap flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#888]"
            aria-label="Прибрати"
          >
            ×
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <input
            type="range"
            min={MIN_PERCENT_PER_SLOT}
            max={100 - MIN_PERCENT_PER_SLOT}
            step={5}
            value={pick.pct}
            onChange={(event) => onPct(Number(event.target.value))}
            className="h-8 min-w-0 flex-1 accent-[#ff4500]"
          />
          <div
            className="w-11 text-right text-[15px] font-bold tabular-nums"
            style={{ color: pick.color }}
          >
            {pick.pct}<span className="text-[10px] opacity-70">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverpackSwitch({
  active,
  price,
  onChange,
}: {
  active: boolean;
  price: number;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      className="tap flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors"
      style={{
        background: active ? "rgba(255,69,0,0.08)" : "rgba(255,255,255,0.02)",
        borderColor: active
          ? "rgba(255,69,0,0.45)"
          : "rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[18px]"
        style={{
          background: active ? "rgba(255,69,0,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${active ? "rgba(255,69,0,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        ⚡
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-bold text-white">Оверпак</span>
          <span
            className="text-[12px] font-bold tabular-nums"
            style={{ color: active ? "#ff8a3d" : "#888" }}
          >
            +{price}₴
          </span>
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-[#888]">
          Більше тютюну, довше куриться, трохи міцніший.
        </div>
      </div>
      <span
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
        style={{
          background: active ? "#ff4500" : "rgba(255,255,255,0.18)",
        }}
        aria-hidden
      >
        <span
          className="inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform"
          style={{ transform: active ? "translateX(22px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}

function CoolSwitch({
  active,
  intensity,
  onToggle,
  onIntensityChange,
}: {
  active: boolean;
  intensity: number;
  onToggle: (next: boolean) => void;
  onIntensityChange: (next: number) => void;
}) {
  return (
    <div
      className="rounded-[14px] border transition-colors"
      style={{
        background: active ? "rgba(120,180,255,0.06)" : "rgba(255,255,255,0.02)",
        borderColor: active ? "rgba(120,180,255,0.4)" : "rgba(255,255,255,0.06)",
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={() => onToggle(!active)}
        className="tap flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[18px]"
          style={{
            background: active ? "rgba(120,180,255,0.18)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${active ? "rgba(120,180,255,0.35)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          ❄
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-bold text-white">Холодок</span>
            <span
              className="text-[12px] font-bold"
              style={{ color: active ? "#7ec8ff" : "#888" }}
            >
              безкоштовно
            </span>
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-[#888]">
            Ментолова прохолода поверх міксу.
          </div>
        </div>
        <span
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
          style={{
            background: active ? "#3b82f6" : "rgba(255,255,255,0.18)",
          }}
          aria-hidden
        >
          <span
            className="inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform"
            style={{ transform: active ? "translateX(22px)" : "translateX(2px)" }}
          />
        </span>
      </button>
      {active && (
        <div className="border-t border-white/[0.05] px-3.5 py-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[11px] font-bold tracking-[1px] text-[#7ec8ff] uppercase">
              Інтенсивність
            </span>
            <span className="text-[13px] font-bold text-white tabular-nums">
              {intensity} / {COOL_MAX_INTENSITY}
            </span>
          </div>
          <input
            type="range"
            min={COOL_MIN_INTENSITY}
            max={COOL_MAX_INTENSITY}
            step={1}
            value={intensity}
            onChange={(event) =>
              onIntensityChange(Number.parseInt(event.target.value, 10))
            }
            className="w-full accent-[#3b82f6]"
            aria-label="Інтенсивність холодку"
          />
          <p
            className="mt-2 rounded-[10px] px-2.5 py-2 text-[11px] leading-snug text-[#ffb070]"
            style={{
              background: "rgba(255,69,0,0.06)",
              border: "1px solid rgba(255,69,0,0.18)",
            }}
          >
            Попередження. Холодок може перебити смак кальяну. Вибирайте з
            обережністю.
          </p>
        </div>
      )}
    </div>
  );
}

function EmptySlot({
  index,
  total,
  onTap,
}: {
  index: number;
  total: number;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="tap flex w-full items-center gap-3 rounded-[14px] border border-dashed border-white/[0.12] bg-transparent p-3.5 text-left"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-[#ff450066] text-[#ff4500]">
        <PlusIcon size={18} />
      </div>
      <div>
        <div className="text-[14px] font-semibold text-white">Обрати тютюн</div>
        <div className="mt-0.5 text-[11px] text-[#666]">
          Слот {index} з {total}
        </div>
      </div>
    </button>
  );
}

function PickerSheet({
  open,
  catalog,
  pickedIds,
  onClose,
  onPick,
}: {
  open: boolean;
  catalog: CatalogTobacco[];
  pickedIds: string[];
  onClose: () => void;
  onPick: (item: CatalogTobacco) => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const filtered = catalog.filter((item) => {
    if (cat !== "all" && item.cat !== cat) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return [item.brand, item.flavor, item.uname].join(" ").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <button
        type="button"
        aria-label="Закрити вибір тютюну"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85dvh] max-w-md flex-col rounded-t-[24px] border border-b-0 border-white/[0.06] bg-[#141010] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] transition-transform duration-300"
        style={{ transform: open ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex justify-center py-2.5">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-[22px] pb-3">
          <h3 className="text-[18px] font-bold text-white">Обери тютюн</h3>
          <button type="button" onClick={onClose} className="tap text-[14px] font-semibold text-[#888]">
            Закрити
          </button>
        </div>
        <div className="px-[22px] pb-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук смаку або бренду..."
            className="h-11 w-full rounded-[10px] border border-white/[0.06] bg-white/[0.04] px-4 text-[14px] text-white outline-none placeholder:text-[#666]"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-[22px] pb-3">
          {CATALOG_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCat(category.id)}
              className="tap shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap"
              style={{
                borderColor: cat === category.id ? "#ff4500" : "rgba(255,255,255,0.1)",
                background: cat === category.id ? "rgba(255,69,0,0.15)" : "transparent",
                color: cat === category.id ? "#ff8a3d" : "#888",
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[22px] pb-7">
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((item) => {
              const picked = pickedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={picked}
                  onClick={() => onPick(item)}
                  className="tap overflow-hidden rounded-[12px] border bg-[#1a1410] text-left disabled:opacity-50"
                  style={{
                    borderColor: picked ? `${item.color}66` : "rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="h-16"
                    style={{
                      background: `radial-gradient(circle at 30% 40%, ${item.color}99, ${item.color}33 60%, #0a0606 100%)`,
                    }}
                  />
                  <div className="p-2.5">
                    <div className="mb-0.5 text-[9px] font-semibold tracking-[0.8px] text-[#888] uppercase">
                      {item.brand}
                    </div>
                    <div className="h-[30px] text-[12.5px] leading-tight font-semibold text-white">
                      {item.uname}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export function MixerClient() {
  const router = useRouter();
  const catalogQuery = useQuery({
    queryKey: ["catalog", "tobaccos"],
    queryFn: fetchCatalogTobaccos,
  });
  const catalog =
    catalogQuery.data && catalogQuery.data.length > 0
      ? catalogQuery.data
      : TOBACCO_CATALOG;
  const slots = useMixStore((state) => state.slots);
  const addTobacco = useMixStore((state) => state.addTobacco);
  const removeTobacco = useMixStore((state) => state.removeTobacco);
  const setPercentage = useMixStore((state) => state.setPercentage);
  const clear = useMixStore((state) => state.clear);
  const isOverpack = useMixStore((state) => state.isOverpack);
  const setOverpack = useMixStore((state) => state.setOverpack);
  const isCool = useMixStore((state) => state.isCool);
  const coolIntensity = useMixStore((state) => state.coolIntensity);
  const setCool = useMixStore((state) => state.setCool);
  const setCoolIntensity = useMixStore((state) => state.setCoolIntensity);
  const saveDraftAction = useDraftsStore((state) => state.add);
  const settings = usePublicSettings();
  const maxIngredients = settings.maxIngredientsPerMix;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);

  const picks = useMemo(
    () =>
      slots
        .map((slot) => {
          const tobacco = catalog.find((item) => item.id === slot.tobaccoId);
          return tobacco ? { ...tobacco, pct: slot.percentage } : null;
        })
        .filter((item): item is Pick => Boolean(item)),
    [catalog, slots],
  );
  // Weighted-mean strength of the mix. Overpack adds a small bump (more tobacco
  // per draw → slightly stronger smoke), capped to the max scale.
  const baseStrength = calculateStrength(
    picks.map((pick) => ({ strength: pick.strength, percentage: pick.pct })),
  );
  const strength =
    picks.length === 0
      ? 0
      : Math.min(MAX_STRENGTH, baseStrength + (isOverpack ? 1 : 0));
  const totalPrice =
    settings.defaultPrice + (isOverpack ? settings.overpackPrice : 0);
  const smoke =
    picks.length === 0
      ? 0
      : picks.reduce((sum, pick) => sum + pick.smoke * pick.pct, 0) / 100;
  const sumPct = picks.reduce((sum, pick) => sum + pick.pct, 0);

  const addPick = (item: CatalogTobacco) => {
    if (slots.length >= maxIngredients) {
      toast(`Максимум ${maxIngredients} тютюни в міксі`);
      return;
    }
    addTobacco(item.id);
    setPickerOpen(false);
    toast(`${item.uname} додано`);
  };

  const saveDraft = () => {
    if (picks.length === 0) {
      toast("Спочатку додай хоча б 1 тютюн");
      return;
    }
    saveDraftAction(
      picks.map((pick) => ({
        tobaccoId: pick.id,
        percentage: pick.pct,
      })),
    );
    toast("Чернетку збережено · дивись у Замовленнях");
  };

  const confirmOrder = (serviceType: ServiceType) => {
    setServiceOpen(false);
    router.push(`/order/new?service=${serviceType}`);
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-hidden bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0">
        <SmokeLayer opacity={0.5} />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[18px] pt-[54px] pb-3.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="tap flex size-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-white"
          aria-label="Назад"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
            Конструктор
          </div>
          <div className="mt-px text-[17px] font-bold text-white">Твій мікс</div>
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={picks.length === 0}
          className="tap flex size-10 items-center justify-center rounded-xl border text-[18px] disabled:text-[#444]"
          style={{
            background: picks.length ? "rgba(255,69,0,0.1)" : "rgba(255,255,255,0.03)",
            borderColor: picks.length ? "rgba(255,69,0,0.3)" : "rgba(255,255,255,0.05)",
            color: picks.length ? "#ff4500" : undefined,
          }}
          aria-label="Очистити"
        >
          ×
        </button>
      </div>

      <div className="no-scrollbar absolute inset-0 overflow-y-auto overflow-x-hidden pt-[100px] pb-28">
        <div className="px-[22px] pt-1 pb-2">
          <HookahVisualizer picks={picks} />
        </div>

        <div className="mx-[22px] mt-2 rounded-[14px] border border-white/[0.05] bg-[#141010]/70 px-3.5 py-3 backdrop-blur">
          <StatRow icon="🔥" label="Міцність" value={strength} max={MAX_STRENGTH} color="#ff4500" />
          <StatRow icon="💨" label="Димність" value={smoke} max={5} color="#a8b3c4" />
        </div>

        <div className="mx-[22px] mt-3 flex flex-col gap-2.5">
          <OverpackSwitch
            active={isOverpack}
            price={settings.overpackPrice}
            onChange={setOverpack}
          />
          <CoolSwitch
            active={isCool}
            intensity={coolIntensity}
            onToggle={setCool}
            onIntensityChange={setCoolIntensity}
          />
        </div>

        <div className="px-[22px] pt-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="m-0 text-[16px] font-bold tracking-[-0.3px] text-white">
              Склад міксу
            </h3>
            <span className="text-[11px] text-[#888] tabular-nums">
              {picks.length} / {maxIngredients} · {sumPct}%
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {picks.map((pick) => (
              <SlotCard
                key={pick.id}
                pick={pick}
                onPct={(pct) => setPercentage(pick.id, pct)}
                onRemove={() => removeTobacco(pick.id)}
              />
            ))}
            {picks.length < maxIngredients && (
              <EmptySlot
                index={picks.length + 1}
                total={maxIngredients}
                onTap={() => setPickerOpen(true)}
              />
            )}
          </div>
        </div>

        {picks.length >= 2 && (
          <div className="mx-[22px] mt-5 rounded-[12px] border border-[#ff450026] bg-[#ff45000f] px-3.5 py-3 text-[12px] leading-5 text-[#ffb070]">
            <span className="font-bold">Підказка кальянщика.</span> Зміна одного
            відсотка автоматично перерозподіляє інші, щоб сума завжди була 100%.
          </div>
        )}

        {catalogQuery.isError && (
          <div className="mx-[22px] mt-4 rounded-[10px] border border-[#ff450033] bg-[#ff45000f] px-3 py-2 text-[12px] text-[#ffb070]">
            Показую локальний каталог: Supabase зараз недоступний.
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-white/[0.05] bg-gradient-to-b from-transparent via-[#0a0a0af5] to-[#0a0a0a] px-4 pt-3 pb-6 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-[64px] shrink-0">
            <div className="mb-px text-[9px] font-semibold tracking-[1.2px] text-[#888] uppercase">
              Ціна
            </div>
            <div className="text-[22px] leading-none font-extrabold tracking-[-0.5px] text-white">
              {totalPrice}<span className="ml-px text-[13px] opacity-70">₴</span>
            </div>
            {isOverpack && (
              <div className="mt-px text-[9px] font-semibold tracking-[0.6px] text-[#ff8a3d]">
                +{settings.overpackPrice}₴ оверпак
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={saveDraft}
            disabled={picks.length === 0}
            className="tap flex h-[52px] shrink-0 items-center justify-center rounded-[14px] border px-4 text-[13px] font-semibold disabled:text-[#555]"
            style={{
              borderColor: picks.length ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
              color: picks.length ? "#fff" : undefined,
            }}
          >
            Зберегти
          </button>
          <button
            type="button"
            onClick={() => setServiceOpen(true)}
            disabled={picks.length === 0}
            className="tap flex h-[52px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[14px] text-[14px] font-bold disabled:text-[#555]"
            style={{
              background: picks.length
                ? "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)"
                : "rgba(255,255,255,0.05)",
              color: picks.length ? "#fff" : undefined,
              animation: picks.length ? "ember-pulse 2.6s ease-in-out infinite" : undefined,
            }}
          >
            <span className="relative z-10 whitespace-nowrap">
              {picks.length ? "Замовити" : "Додай тютюн"}
            </span>
            {picks.length > 0 && <ChevronIcon size={14} />}
          </button>
        </div>
      </div>

      <PickerSheet
        open={pickerOpen}
        catalog={catalog}
        pickedIds={slots.map((slot: MixSlot) => slot.tobaccoId)}
        onClose={() => setPickerOpen(false)}
        onPick={addPick}
      />

      <ServiceSheet
        open={serviceOpen}
        isOverpack={isOverpack}
        onClose={() => setServiceOpen(false)}
        onConfirm={confirmOrder}
      />
    </div>
  );
}
