"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TOBACCO_MAX_STRENGTH } from "@/lib/constants";
import { StrengthMeter } from "../../components/StrengthMeter";
import type { CatalogTobacco } from "../_catalog-data";
import { CAT_LABEL } from "../_catalog-data";
import { TobaccoPhoto } from "./TobaccoPhoto";

type Props = {
  item: CatalogTobacco | null;
  picked: boolean;
  onClose: () => void;
  onAdd: (item: CatalogTobacco) => void;
};

export function DetailSheet({ item, picked, onClose, onAdd }: Props) {
  const open = item !== null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-hidden rounded-t-3xl border-x-0 border-b-0 p-0"
        style={{
          background: "#141010",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {item && (
          <div className="flex h-full flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>{item.uname}</SheetTitle>
            </SheetHeader>

            {/* Drag handle */}
            <div className="flex justify-center pt-2.5">
              <div
                className="h-1 w-10 rounded-sm"
                style={{ background: "rgba(255,255,255,0.18)" }}
              />
            </div>

            {/* Scrollable body */}
            <div className="no-scrollbar overflow-y-auto">
              <div className="mx-[22px] mt-3.5 overflow-hidden rounded-[14px]">
                <TobaccoPhoto item={item} />
              </div>
              <div className="px-[22px] pt-5">
                <div className="mb-1 text-[11px] font-bold tracking-[2px] text-[#ff8a3d] uppercase">
                  {item.brand}
                </div>
                <h2 className="m-0 text-[26px] leading-[1.1] font-extrabold tracking-[-0.6px] text-white">
                  {item.uname}
                </h2>
                <div className="mt-1 text-[13px] text-[#666]">{item.flavor}</div>

                <p className="my-[18px] text-[14.5px] leading-[1.5] text-balance text-[#aaa]">
                  {item.desc}
                </p>

                {/* Stats grid */}
                <div className="mb-[18px] grid grid-cols-2 gap-2.5">
                  <DetailStat label="Міцність" icon="🔥" value={item.strength} />
                  <DetailStat label="Димність" icon="💨" value={item.smoke} />
                  <DetailStat label="Категорія" text value={CAT_LABEL[item.cat] ?? item.cat} />
                  <DetailStat label="Популярність" icon="★" value={item.popularity} />
                </div>

                {item.pairs.length > 0 && (
                  <div className="mb-[18px]">
                    <div className="mb-2 text-[11px] font-semibold tracking-[1.2px] text-[#888] uppercase">
                      Найкраще з
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.pairs.map((p) => (
                        <div
                          key={p}
                          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
                          style={{
                            background: `${item.color}1a`,
                            border: `1px solid ${item.color}44`,
                          }}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky CTA */}
            <div
              className="flex gap-2.5 px-[22px] pt-3.5 pb-7"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(10,10,10,0.9)",
                backdropFilter: "blur(20px)",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрити"
                className="tap flex h-[52px] w-14 items-center justify-center rounded-[14px] text-white"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  onAdd(item);
                  onClose();
                }}
                disabled={!item.inStock || picked}
                className="tap h-[52px] flex-1 rounded-[14px] text-[15px] font-bold"
                style={{
                  background: picked
                    ? `linear-gradient(180deg, ${item.color}cc, ${item.color})`
                    : !item.inStock
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(180deg, #ff6a1f, #ff4500)",
                  color: !item.inStock && !picked ? "#555" : "#fff",
                  boxShadow: picked
                    ? `0 6px 24px ${item.color}55`
                    : item.inStock
                      ? "0 6px 24px rgba(255,69,0,0.35)"
                      : undefined,
                }}
              >
                {picked
                  ? "✓ Додано в мікс"
                  : !item.inStock
                    ? "Закінчився"
                    : "Додати в мікс"}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

type StatProps =
  | { label: string; value: number; icon: string; text?: false }
  | { label: string; value: string; icon?: undefined; text: true };

function DetailStat(props: StatProps) {
  return (
    <div
      className="rounded-[10px] p-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="mb-1 text-[10px] font-semibold tracking-[1px] text-[#888] uppercase">
        {props.label}
      </div>
      {props.text ? (
        <div className="text-[14px] font-bold text-white">{props.value}</div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-[13px]">{props.icon}</span>
          <StrengthMeter
            value={props.value}
            max={TOBACCO_MAX_STRENGTH}
            tickWidth={7}
            tickHeight={3}
            gap={3}
          />
        </div>
      )}
    </div>
  );
}
