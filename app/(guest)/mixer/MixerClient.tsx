"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DEFAULT_PRICE_UAH,
  MAX_INGREDIENTS_PER_MIX,
  MIN_PERCENT_PER_SLOT,
  type ServiceType,
} from "@/lib/constants";
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
  const active = picks.length > 0;
  const cavityX = 116;
  const cavityY = 60;
  const cavityW = 48;
  const cavityH = 30;
  const stripes = picks.map((pick, index) => {
    const h = (pick.pct / 100) * cavityH;
    const previousHeight = picks
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.pct / 100) * cavityH, 0);
    return { ...pick, y: cavityY + cavityH - previousHeight - h, h };
  });

  return (
    <div className="relative flex h-[300px] w-full items-end justify-center">
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-[260px] -translate-x-1/2">
        <svg width="100%" height="100%" viewBox="0 0 260 80">
          <ellipse cx="130" cy="60" rx="125" ry="14" fill="none" stroke="rgba(255,69,0,0.06)" />
          <ellipse cx="130" cy="60" rx="100" ry="11" fill="none" stroke="rgba(255,69,0,0.08)" />
          <ellipse
            cx="130"
            cy="60"
            rx="50"
            ry="7"
            fill={active ? "rgba(255,69,0,0.18)" : "rgba(255,69,0,0.05)"}
          />
        </svg>
      </div>

      {active && (
        <div className="pointer-events-none absolute top-0 left-1/2 h-[120px] w-[240px] -translate-x-1/2">
          <svg viewBox="0 0 240 160" width="100%" height="100%">
            <defs>
              <radialGradient id="mixer-puff-grad">
                <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="50%" stopColor="rgba(255,180,140,0.18)" />
                <stop offset="100%" stopColor="rgba(255,69,0,0)" />
              </radialGradient>
            </defs>
            {[96, 120, 144, 108, 132].map((x, i) => (
              <circle
                key={i}
                cx={x}
                cy="130"
                r={i === 1 ? 27 : 19}
                fill="url(#mixer-puff-grad)"
                style={{
                  animation: `rise-puff 4.5s ease-out ${i * 0.55}s infinite`,
                  filter: "blur(3px)",
                }}
              />
            ))}
          </svg>
        </div>
      )}

      <svg
        viewBox="0 0 280 380"
        width="260"
        height="353"
        className="relative"
        style={{
          filter: active
            ? "drop-shadow(0 16px 30px rgba(255,69,0,0.18))"
            : "drop-shadow(0 6px 18px rgba(0,0,0,0.55))",
        }}
      >
        <defs>
          <linearGradient id="hk-stem" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0a0a0a" />
            <stop offset="35%" stopColor="#5a5a5a" />
            <stop offset="50%" stopColor="#7a7a7a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </linearGradient>
          <linearGradient id="hk-brass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a5e2a" />
            <stop offset="35%" stopColor="#d4ab5b" />
            <stop offset="100%" stopColor="#3a2812" />
          </linearGradient>
          <radialGradient id="hk-vase" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#3a2a1f" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#1a100a" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#080404" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="hk-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c25030" stopOpacity="0.2" />
            <stop offset="45%" stopColor="#8b0000" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#400000" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="hk-clay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a1f14" />
            <stop offset="55%" stopColor="#4a2a18" />
            <stop offset="100%" stopColor="#1a0e08" />
          </linearGradient>
          <radialGradient id="hk-coal" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#fff2c8" />
            <stop offset="25%" stopColor="#ffb070" />
            <stop offset="65%" stopColor="#ff4500" />
            <stop offset="100%" stopColor="#3a0a00" stopOpacity="0.9" />
          </radialGradient>
          <clipPath id="hk-cavity">
            <path
              d={`M ${cavityX} ${cavityY} L ${cavityX + cavityW} ${cavityY} L ${
                cavityX + cavityW - 4
              } ${cavityY + cavityH} L ${cavityX + 4} ${cavityY + cavityH} Z`}
            />
          </clipPath>
        </defs>

        <g opacity={active ? 0.95 : 0.45}>
          <path
            d="M162 175 C220 170 250 220 240 270 C235 305 200 320 175 340"
            stroke="#4a281a"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="167" y="335" width="12" height="10" rx="2" fill="url(#hk-brass)" />
        </g>

        <g opacity={active ? 1 : 0.6}>
          <path
            d="M116 220 L116 240 C80 248 60 280 60 310 C60 348 110 360 140 360 C170 360 220 348 220 310 C220 280 200 248 164 240 L164 220 Z"
            fill="url(#hk-vase)"
            stroke="rgba(255,255,255,0.08)"
          />
          <path
            d="M66 290 C62 320 90 348 140 348 C190 348 218 320 214 290 C200 304 170 306 140 306 C110 306 80 304 66 290 Z"
            fill="url(#hk-liquid)"
          />
          {active &&
            [110, 140, 170, 125, 155].map((x, i) => (
              <circle
                key={i}
                cx={x}
                cy="340"
                r="2.4"
                fill="rgba(255,200,150,0.45)"
                style={{ animation: `bubble-up 3s ease-in ${i * 0.45}s infinite` }}
              />
            ))}
          <ellipse cx="80" cy="290" rx="4" ry="32" fill="rgba(255,255,255,0.08)" />
        </g>

        <g opacity={active ? 1 : 0.55}>
          <path d="M122 100 L158 100 L154 116 L126 116 Z" fill="url(#hk-stem)" />
          <rect x="128" y="116" width="24" height="100" fill="url(#hk-stem)" />
          <rect x="124" y="138" width="32" height="6" rx="1" fill="url(#hk-brass)" />
          <rect x="152" y="166" width="14" height="8" rx="1.5" fill="url(#hk-stem)" />
          <circle cx="164" cy="170" r="3.5" fill="url(#hk-brass)" />
          <rect x="124" y="200" width="32" height="6" rx="1" fill="url(#hk-brass)" />
          <rect x="116" y="214" width="48" height="8" rx="1.5" fill="url(#hk-stem)" />
          <ellipse cx="140" cy="100" rx="56" ry="5" fill="#3a3a3a" />
        </g>

        <g>
          <path
            d="M108 42 Q108 38 112 38 L168 38 Q172 38 172 42 L162 96 Q162 100 158 100 L122 100 Q118 100 118 96 L108 42 Z"
            fill="url(#hk-clay)"
            stroke="rgba(0,0,0,0.6)"
            opacity={active ? 1 : 0.65}
          />
          <g clipPath="url(#hk-cavity)">
            <rect x={cavityX} y={cavityY} width={cavityW} height={cavityH + 4} fill="#0a0606" />
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
            <circle
              cx={cavityX + cavityW / 2}
              cy={cavityY + cavityH - 4}
              r="2"
              fill="#0a0606"
            />
          </g>
          <ellipse cx="140" cy="36" rx="36" ry="4" fill="#9a9a9a" opacity={active ? 1 : 0.45} />
          <g
            style={{
              animation: active ? "ember-flicker 2.6s ease-in-out infinite" : "none",
              transformOrigin: "140px 28px",
            }}
            opacity={active ? 1 : 0.45}
          >
            <circle cx="122" cy="30" r="7" fill="url(#hk-coal)" />
            <circle cx="140" cy="26" r="8" fill="url(#hk-coal)" />
            <circle cx="158" cy="30" r="7" fill="url(#hk-coal)" />
          </g>
        </g>

        <ellipse cx="140" cy="360" rx="74" ry="7" fill="#2a2a2a" />
        <ellipse cx="140" cy="358" rx="74" ry="5" fill="url(#hk-brass)" opacity="0.7" />
      </svg>

      {!active && (
        <div className="pointer-events-none absolute top-[60px] inset-x-0 text-center">
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

function StatRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <div className="w-[22px] shrink-0 text-center text-[14px]">{icon}</div>
      <div className="w-[88px] shrink-0 text-[12px] font-medium text-[#888]">
        {label}
      </div>
      <div className="flex flex-1 gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const fill =
            index < Math.floor(value)
              ? "100%"
              : index === Math.floor(value) && value % 1 !== 0
                ? `${(value % 1) * 100}%`
                : "0%";
          return (
            <div
              key={index}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: fill,
                  background: `linear-gradient(90deg, ${color}99, ${color})`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="w-[34px] text-right text-[12px] font-bold text-white tabular-nums">
        {value.toFixed(1)}
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

function EmptySlot({ index, onTap }: { index: number; onTap: () => void }) {
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
          Слот {index} з {MAX_INGREDIENTS_PER_MIX}
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
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] max-w-md flex-col rounded-t-[24px] border border-b-0 border-white/[0.06] bg-[#141010] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] transition-transform duration-300"
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
  const saveDraftAction = useDraftsStore((state) => state.add);
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
  const strength = calculateStrength(
    picks.map((pick) => ({ strength: pick.strength, percentage: pick.pct })),
  );
  const smoke =
    picks.length === 0
      ? 0
      : picks.reduce((sum, pick) => sum + pick.smoke * pick.pct, 0) / 100;
  const complexity =
    picks.length === 0
      ? 0
      : Math.min(5, picks.length + (new Set(picks.map((pick) => pick.cat)).size - 1) * 0.5);
  const sumPct = picks.reduce((sum, pick) => sum + pick.pct, 0);

  const addPick = (item: CatalogTobacco) => {
    if (slots.length >= MAX_INGREDIENTS_PER_MIX) {
      toast(`Максимум ${MAX_INGREDIENTS_PER_MIX} тютюни в міксі`);
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
          <StatRow icon="🔥" label="Міцність" value={strength} color="#ff4500" />
          <StatRow icon="💨" label="Димність" value={smoke} color="#a8b3c4" />
          <StatRow icon="✦" label="Складність" value={complexity} color="#c98b3c" />
        </div>

        <div className="px-[22px] pt-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="m-0 text-[16px] font-bold tracking-[-0.3px] text-white">
              Склад міксу
            </h3>
            <span className="text-[11px] text-[#888] tabular-nums">
              {picks.length} / {MAX_INGREDIENTS_PER_MIX} · {sumPct}%
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
            {picks.length < MAX_INGREDIENTS_PER_MIX && (
              <EmptySlot index={picks.length + 1} onTap={() => setPickerOpen(true)} />
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
          <div className="w-[60px] shrink-0">
            <div className="mb-px text-[9px] font-semibold tracking-[1.2px] text-[#888] uppercase">
              Ціна
            </div>
            <div className="text-[22px] leading-none font-extrabold tracking-[-0.5px] text-white">
              {DEFAULT_PRICE_UAH}<span className="ml-px text-[13px] opacity-70">₴</span>
            </div>
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
        onClose={() => setServiceOpen(false)}
        onConfirm={confirmOrder}
      />
    </div>
  );
}
