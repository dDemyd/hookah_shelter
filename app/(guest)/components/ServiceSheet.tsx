"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type ServiceType,
} from "@/lib/constants";
import { usePublicSettings } from "@/lib/hooks/use-max-ingredients";

const ICONS: Record<ServiceType, string> = {
  hookah: "🪔",
  refill: "🍃",
  day_loaner: "🎒",
};

type Props = {
  open: boolean;
  isOverpack?: boolean;
  onClose: () => void;
  onConfirm: (serviceType: ServiceType) => void;
};

export function ServiceSheet(props: Props) {
  // Remount the inner content when `open` toggles to true so `selected`
  // resets to the default ("hookah") each time — cleaner than a useEffect
  // that calls setState (React 19 flags that as a smell).
  return (
    <Sheet open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      {props.open ? <ServiceSheetBody {...props} /> : null}
    </Sheet>
  );
}

function ServiceSheetBody({ isOverpack = false, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<ServiceType>("hookah");
  const settings = usePublicSettings();
  const descriptions: Record<ServiceType, string> = {
    hookah:
      "Повний сервіс: чаша, колба, кальянщик. Подача на стіл за 10 хвилин.",
    refill: "Мікс з собою - якщо є бажання покурити кальян вдома.",
    day_loaner: `Беріть кальян з собою. Залог ${settings.dayLoanerDeposit} ₴ (повертається) + вартість міксу. У комплекті: кальян, чаша, шипці, калауд тощо.`,
  };
  const priceFor = (id: ServiceType): number => {
    const base =
      id === "hookah"
        ? settings.defaultPrice
        : id === "refill"
          ? settings.refillPrice
          : settings.dayLoanerPrice + settings.dayLoanerDeposit;
    return base + (isOverpack ? settings.overpackPrice : 0);
  };

  return (
    <>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[85dvh] overflow-hidden rounded-t-3xl border-x-0 border-b-0 p-0"
        style={{
          background: "#141010",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex justify-center pt-2.5">
          <div
            className="h-1 w-10 rounded-sm"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
        </div>

        <SheetHeader className="px-[22px] pt-2 pb-2 text-left">
          <div className="text-[10px] font-bold tracking-[2px] text-[#ff4500] uppercase">
            Замовлення
          </div>
          <SheetTitle className="m-0 text-[22px] font-extrabold tracking-[-0.5px] text-white">
            Що подати на стіл?
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4 pt-3.5 pb-1">
          {SERVICE_TYPES.map((id) => {
            const active = id === selected;
            const price = priceFor(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className="tap flex items-center gap-3.5 rounded-[14px] p-3.5 text-left transition-colors duration-200"
                style={{
                  background: active ? "rgba(255,69,0,0.08)" : "#1c1815",
                  border: `1px solid ${active ? "rgba(255,69,0,0.5)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[22px]"
                  style={{
                    background: active
                      ? "rgba(255,69,0,0.15)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "rgba(255,69,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {ICONS[id]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between">
                    <div className="text-[16px] font-bold tracking-[-0.2px] text-white">
                      {SERVICE_TYPE_LABELS[id]}
                    </div>
                    <div
                      className="text-[16px] font-extrabold tracking-[-0.3px] tabular-nums"
                      style={{ color: active ? "#ff8a3d" : "#aaa" }}
                    >
                      {price}
                      <span className="text-[11px] opacity-70">₴</span>
                    </div>
                  </div>
                  <div className="text-[12px] leading-snug text-[#888]">
                    {descriptions[id]}
                  </div>
                </div>
                <div
                  className="flex size-5 shrink-0 items-center justify-center rounded-full"
                  style={{
                    border: `2px solid ${active ? "#ff4500" : "rgba(255,255,255,0.18)"}`,
                    background: active ? "#ff4500" : "transparent",
                  }}
                >
                  {active && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12l5 5L20 7"
                        stroke="#fff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2.5 px-4 pt-4 pb-7">
          <button
            type="button"
            onClick={onClose}
            className="tap h-[52px] rounded-[14px] px-4 text-[14px] font-semibold text-white"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className="tap h-[52px] flex-1 rounded-[14px] text-[15px] font-bold text-white"
            style={{
              background:
                "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)",
              boxShadow: "0 6px 22px rgba(255,69,0,0.4)",
            }}
          >
            Підтвердити замовлення
          </button>
        </div>
      </SheetContent>
    </>
  );
}
