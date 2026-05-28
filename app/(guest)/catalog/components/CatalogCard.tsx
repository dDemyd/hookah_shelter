"use client";

import { TOBACCO_MAX_STRENGTH } from "@/lib/constants";
import { CheckIcon, HeartIcon, PlusIcon } from "../../components/Icon";
import { StrengthMeter } from "../../components/StrengthMeter";
import type { CatalogTobacco } from "../_catalog-data";
import { CAT_LABEL } from "../_catalog-data";
import { TobaccoPhoto } from "./TobaccoPhoto";

type Props = {
  item: CatalogTobacco;
  picked: boolean;
  liked: boolean;
  likeCount: number;
  onAdd: (item: CatalogTobacco) => void;
  onLike: (item: CatalogTobacco) => void;
  onOpenDetail: (item: CatalogTobacco) => void;
};

export function CatalogCard({
  item,
  picked,
  liked,
  likeCount,
  onAdd,
  onLike,
  onOpenDetail,
}: Props) {
  const out = !item.inStock;

  return (
    <div
      className="relative overflow-hidden rounded-[14px] transition-all duration-200"
      style={{
        background: "#141010",
        border: `1px solid ${picked ? `${item.color}66` : "rgba(255,255,255,0.05)"}`,
        boxShadow: picked
          ? `0 0 0 1px ${item.color}55, 0 4px 16px ${item.color}22`
          : undefined,
        opacity: out ? 0.7 : 1,
      }}
    >
      {/* Photo (also opens detail) + like overlay live in the same relative wrapper
          so the like chip can be a sibling of the photo button (avoiding nested buttons). */}
      <div className="relative">
      <button
        type="button"
        onClick={() => !out && onOpenDetail(item)}
        aria-label={`Відкрити ${item.brand} ${item.uname}`}
        className="tap relative block w-full p-0"
        disabled={out}
      >
        <TobaccoPhoto item={item} dim={out} />

        {/* Badge: out-of-stock takes priority */}
        {out ? (
          <div
            className="absolute top-2 left-2 rounded px-2 py-1 text-[9px] font-bold tracking-[1.2px] uppercase text-[#888] backdrop-blur"
            style={{
              background: "rgba(20,12,12,0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Закінчився
          </div>
        ) : item.popularity >= 5 ? (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 rounded px-2 py-1 text-[9px] font-bold tracking-[1.2px] text-white uppercase"
            style={{ background: "rgba(255,69,0,0.92)" }}
          >
            ★ Хіт
          </div>
        ) : null}

        {/* "Нове" badge, position depends on whether Хіт is already left */}
        {item.isNew && !out && item.popularity < 5 && (
          <div
            className="absolute top-2 left-2 rounded px-2 py-1 text-[9px] font-bold tracking-[1.2px] text-[#ff8a3d] uppercase backdrop-blur"
            style={{
              background: "rgba(20,12,12,0.92)",
              border: "1px solid rgba(255,69,0,0.5)",
            }}
          >
            ✦ Нове
          </div>
        )}
        {item.isNew && !out && item.popularity >= 5 && (
          <div
            className="absolute top-10 left-2 rounded px-2 py-1 text-[9px] font-bold tracking-[1.2px] text-[#ff8a3d] uppercase backdrop-blur"
            style={{
              background: "rgba(20,12,12,0.92)",
              border: "1px solid rgba(255,69,0,0.5)",
            }}
          >
            ✦ Нове
          </div>
        )}
      </button>

      {/* Like chip — bottom-right overlay on the photo. Sibling of the photo button
          (not nested) to keep HTML valid and screen-reader semantics clean. */}
      <button
        type="button"
        onClick={() => onLike(item)}
        aria-label={liked ? "Прибрати вподобайку" : "Вподобати"}
        aria-pressed={liked}
        className="tap absolute right-2 bottom-2 flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-2.5 backdrop-blur"
        style={{
          background: liked ? "rgba(255,69,0,0.18)" : "rgba(20,12,12,0.7)",
          border: `1px solid ${liked ? "rgba(255,106,43,0.6)" : "rgba(255,255,255,0.14)"}`,
          color: liked ? "#ff6a2b" : "rgba(255,255,255,0.9)",
        }}
      >
        <HeartIcon size={15} filled={liked} />
        {likeCount > 0 && (
          <span className="text-[11px] font-semibold tabular-nums">
            {likeCount}
          </span>
        )}
      </button>
      </div>

      {/* Footer */}
      <div className="relative px-3 pt-2.5 pb-3.5">
        <div className="mb-0.5 text-[9.5px] font-bold tracking-[1.4px] text-[#ff8a3d] uppercase">
          {item.brand}
        </div>
        <div className="mb-2 h-8 text-[14px] leading-[1.15] font-bold tracking-[-0.2px] text-white">
          {item.uname}
        </div>

        <div className="mb-2.5 flex items-center gap-2">
          <StrengthMeter
            value={item.strength}
            max={TOBACCO_MAX_STRENGTH}
            tickWidth={7}
            tickHeight={3}
            gap={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div
            className="rounded px-2 py-[3px] text-[10px] font-semibold text-[#888]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {CAT_LABEL[item.cat] ?? item.cat}
          </div>

          <button
            type="button"
            onClick={() => !out && onAdd(item)}
            disabled={out}
            aria-label={picked ? "У міксі" : "Додати в мікс"}
            aria-pressed={picked}
            className="tap flex size-11 items-center justify-center rounded-[12px] text-white disabled:cursor-not-allowed"
            style={{
              background: picked
                ? item.color
                : out
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(255,69,0,0.95)",
              boxShadow: picked
                ? `0 0 12px ${item.color}66`
                : out
                  ? undefined
                  : "0 4px 12px rgba(255,69,0,0.4)",
            }}
          >
            {picked ? (
              <CheckIcon size={14} />
            ) : out ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 5l14 14M19 5L5 19"
                  stroke="#444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <PlusIcon size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
