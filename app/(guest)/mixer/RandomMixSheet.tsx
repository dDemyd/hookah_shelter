"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { COOL_MAX_INTENSITY, COOL_MIN_INTENSITY } from "@/lib/constants";
import type { CatalogTobacco } from "../catalog/_catalog-data";
import {
  isMuted as readMuted,
  playBonusChime,
  playSpin,
  playThunk,
  setMuted as persistMuted,
  unlockAudio,
  type ScheduledAudio,
} from "./random-mix-audio";

const OVERPACK_CHANCE = 0.05;
const COOL_CHANCE = 0.25;
const CELL_H = 104;
const STRIP_LENGTH = 32;
// Stagger reel stop times so the eye reads "drumroll" — left first, right last.
const SPIN_DURATIONS_MS = [2200, 2900, 3600, 4300];

export type RandomMixResult = {
  picks: CatalogTobacco[];
  overpack: boolean;
  cool: boolean;
  coolIntensity: number;
};

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function rollMix(catalog: CatalogTobacco[], slotCount: number): RandomMixResult {
  const available = catalog.filter((t) => t.inStock);
  const picks = shuffle(available).slice(0, Math.min(slotCount, available.length));
  return {
    picks,
    overpack: Math.random() < OVERPACK_CHANCE,
    cool: Math.random() < COOL_CHANCE,
    coolIntensity:
      COOL_MIN_INTENSITY +
      Math.floor(Math.random() * (COOL_MAX_INTENSITY - COOL_MIN_INTENSITY + 1)),
  };
}

function buildStrip(
  pool: CatalogTobacco[],
  target: CatalogTobacco,
): CatalogTobacco[] {
  if (pool.length === 0) return [target];
  const items: CatalogTobacco[] = [];
  while (items.length < STRIP_LENGTH - 1) {
    for (const item of shuffle(pool)) {
      if (items.length >= STRIP_LENGTH - 1) break;
      items.push(item);
    }
  }
  items.push(target);
  return items;
}

function ReelCell({ item }: { item: CatalogTobacco }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-1.5 px-1"
      style={{ height: CELL_H }}
    >
      <div
        className="size-11 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${item.color}, ${item.color}99 55%, ${item.color}33)`,
          boxShadow: `0 0 14px ${item.color}55, inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
      />
      <div className="w-full px-0.5 text-center">
        <div className="truncate text-[7.5px] font-bold tracking-[0.6px] text-white/55 uppercase leading-none">
          {item.brand}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[10px] leading-tight font-semibold text-white">
          {item.uname}
        </div>
      </div>
    </div>
  );
}

function Reel({
  pool,
  target,
  durationMs,
  rollKey,
  reelIndex,
  onLand,
}: {
  pool: CatalogTobacco[];
  target: CatalogTobacco;
  durationMs: number;
  rollKey: number;
  reelIndex: number;
  onLand: () => void;
}) {
  const strip = useMemo(
    () => buildStrip(pool, target),
    // Rebuild strip per roll so the spin shows a fresh sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rollKey, target.id],
  );
  const targetIndex = strip.length - 1;
  const [phase, setPhase] = useState<"idle" | "spinning" | "landed">("idle");

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    setPhase("idle");

    if (reducedMotion) {
      setPhase("landed");
      onLand();
      return;
    }

    // Double rAF so the browser commits the "idle" (translateY 0, no transition)
    // frame before we kick off the spin transition. The reel-spin SOUND is
    // played once at the roll level (in the parent), so individual reels
    // only fire their landing thunk.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setPhase("spinning");
      });
    });
    const timer = setTimeout(() => {
      setPhase("landed");
      onLand();
      try {
        playThunk(reelIndex);
      } catch {
        /* audio is non-essential */
      }
    }, durationMs);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollKey]);

  const transform =
    phase === "idle"
      ? "translateY(0)"
      : `translateY(-${targetIndex * CELL_H}px)`;
  const transition =
    phase === "spinning"
      ? `transform ${durationMs}ms cubic-bezier(0.1, 0.72, 0.12, 1)`
      : "none";

  return (
    <div
      className="relative overflow-hidden rounded-[12px] border border-white/[0.05] bg-[#0d0808]"
      style={{ height: CELL_H }}
    >
      <div
        style={{
          transform,
          transition,
          willChange: "transform",
        }}
      >
        {strip.map((item, i) => (
          <ReelCell key={`${i}-${item.id}`} item={item} />
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[12px] transition-[box-shadow,border-color] duration-300"
        style={{
          boxShadow:
            phase === "landed"
              ? `inset 0 0 0 1.5px ${target.color}, 0 0 18px ${target.color}55`
              : "inset 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-6 rounded-t-[12px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,8,8,0.95) 0%, rgba(13,8,8,0) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-[12px]"
        style={{
          background:
            "linear-gradient(0deg, rgba(13,8,8,0.95) 0%, rgba(13,8,8,0) 100%)",
        }}
      />
    </div>
  );
}

function AddOnLamp({
  active,
  reveal,
  icon,
  label,
  color,
  detail,
}: {
  active: boolean;
  reveal: boolean;
  icon: string;
  label: string;
  color: string;
  detail: string;
}) {
  const lit = reveal && active;
  return (
    <div
      className="flex flex-1 items-center gap-2.5 rounded-[12px] border px-3 py-2.5 transition-all duration-300"
      style={{
        borderColor: lit ? `${color}80` : "rgba(255,255,255,0.06)",
        background: lit ? `${color}1f` : "rgba(255,255,255,0.02)",
        boxShadow: lit ? `0 0 18px ${color}33` : "none",
      }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[18px]"
        style={{
          background: lit ? `${color}33` : "rgba(255,255,255,0.04)",
          border: `1px solid ${lit ? `${color}66` : "rgba(255,255,255,0.06)"}`,
          color: lit ? color : "#555",
          transition: "all 300ms ease",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[12px] font-bold"
          style={{ color: lit ? "#fff" : "#888" }}
        >
          {label}
        </div>
        <div
          className="mt-0.5 truncate text-[10px]"
          style={{ color: lit ? `${color}cc` : "#666" }}
        >
          {reveal ? detail : "…"}
        </div>
      </div>
    </div>
  );
}

export function RandomMixSheet({
  open,
  catalog,
  slotCount,
  onClose,
  onApply,
}: {
  open: boolean;
  catalog: CatalogTobacco[];
  slotCount: number;
  onClose: () => void;
  onApply: (result: RandomMixResult) => void;
}) {
  const pool = useMemo(
    () => catalog.filter((item) => item.inStock),
    [catalog],
  );
  const [rollKey, setRollKey] = useState(0);
  const [result, setResult] = useState<RandomMixResult | null>(null);
  const [landedCount, setLandedCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMutedState(readMuted());
  }, []);

  const toggleMute = () => {
    const next = !muted;
    persistMuted(next);
    setMutedState(next);
    if (!next) unlockAudio();
  };

  const allLanded = result ? landedCount >= result.picks.length : false;

  useEffect(() => {
    if (!allLanded || !result) return;
    if (!result.overpack && !result.cool) return;
    try {
      playBonusChime();
    } catch {
      /* audio is non-essential */
    }
  }, [allLanded, result]);

  useEffect(() => {
    if (!open) return;
    setResult(rollMix(catalog, slotCount));
    setLandedCount(0);
    setRollKey((k) => k + 1);
  }, [open, catalog, slotCount]);

  // One spin-sound per roll. Cleanup cuts it off when the user closes
  // the sheet mid-spin or hits Перекрутити.
  useEffect(() => {
    if (!open || rollKey === 0) return;
    let handle: ScheduledAudio | null = null;
    try {
      handle = playSpin();
    } catch {
      /* audio is non-essential */
    }
    return () => {
      handle?.cancel();
    };
  }, [rollKey, open]);

  const reroll = () => {
    if (!allLanded) return;
    setResult(rollMix(catalog, slotCount));
    setLandedCount(0);
    setRollKey((k) => k + 1);
  };

  const handleApply = () => {
    if (!result || !allLanded || result.picks.length === 0) return;
    onApply(result);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Закрити рандомний мікс"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          visibility: open ? "visible" : "hidden",
          transition: open
            ? "opacity 220ms ease-out"
            : "opacity 180ms ease-in, visibility 0s linear 180ms",
        }}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-md flex-col rounded-t-[24px] border border-b-0 border-white/[0.06] bg-[#141010] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] transition-transform duration-300"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
        }}
        aria-hidden={!open}
      >
        <div className="flex min-h-11 items-center justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-[22px] pb-3">
          <div>
            <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
              🎲 Shelter
            </div>
            <div className="mt-px text-[18px] font-bold text-white">
              Рандомний мікс
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
              aria-pressed={muted}
              className="tap flex size-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-[15px] text-white/80"
            >
              <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="tap text-[14px] font-semibold text-[#888]"
            >
              Закрити
            </button>
          </div>
        </div>

        <div className="px-[22px] pb-4">
          {result && result.picks.length > 0 ? (
            <>
              <div
                className="relative rounded-[18px] border p-2"
                style={{
                  background:
                    "linear-gradient(180deg, #1a1010 0%, #0a0606 100%)",
                  borderColor: "rgba(255,69,0,0.28)",
                  boxShadow:
                    "0 0 24px rgba(255,69,0,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div
                  className="grid gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${result.picks.length}, 1fr)`,
                  }}
                >
                  {result.picks.map((target, i) => (
                    <Reel
                      key={i}
                      pool={pool}
                      target={target}
                      durationMs={SPIN_DURATIONS_MS[i] ?? 3500}
                      rollKey={rollKey}
                      reelIndex={i}
                      onLand={() => setLandedCount((c) => c + 1)}
                    />
                  ))}
                </div>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-2 top-1/2 h-px -translate-y-1/2"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,69,0,0.18) 50%, transparent 100%)",
                  }}
                />
              </div>

              <div className="mt-3 flex gap-2.5">
                <AddOnLamp
                  active={result.overpack}
                  reveal={allLanded}
                  icon="⚡"
                  label="Оверпак"
                  color="#ff4500"
                  detail={result.overpack ? "у міксі" : "без оверпаку"}
                />
                <AddOnLamp
                  active={result.cool}
                  reveal={allLanded}
                  icon="❄"
                  label="Холодок"
                  color="#3b82f6"
                  detail={
                    result.cool
                      ? `інтенсивність ${result.coolIntensity}/${COOL_MAX_INTENSITY}`
                      : "без холодку"
                  }
                />
              </div>

              <p
                className="mt-3 text-center text-[11px] leading-snug text-[#888]"
                style={{
                  opacity: allLanded ? 1 : 0,
                  transition: "opacity 300ms ease 120ms",
                }}
              >
                Подобається? Застосуй або крути ще.
              </p>
            </>
          ) : (
            <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center text-[12px] text-[#888]">
              Зараз у каталозі немає тютюнів у наявності.
            </div>
          )}
        </div>

        <div className="mt-auto border-t border-white/[0.05] px-[22px] pt-3 pb-6">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={reroll}
              disabled={!allLanded || !result || result.picks.length === 0}
              className="tap flex h-[52px] flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-white/[0.18] text-[14px] font-semibold text-white disabled:border-white/[0.06] disabled:text-[#555]"
            >
              <span>🎲</span> Перекрутити
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!allLanded || !result || result.picks.length === 0}
              className="tap flex h-[52px] flex-1 items-center justify-center rounded-[14px] text-[14px] font-bold disabled:text-[#555]"
              style={{
                background:
                  allLanded && result && result.picks.length > 0
                    ? "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)"
                    : "rgba(255,255,255,0.05)",
                color:
                  allLanded && result && result.picks.length > 0
                    ? "#fff"
                    : undefined,
              }}
            >
              Застосувати
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
