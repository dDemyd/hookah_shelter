"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Option = string | { id: string; label: string };

type Props = {
  open: boolean;
  title: string;
  options: readonly Option[];
  value: string;
  onPick: (id: string) => void;
  onClose: () => void;
};

export function OptionSheet({
  open,
  title,
  options,
  value,
  onPick,
  onClose,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[70dvh] overflow-hidden rounded-t-3xl border-x-0 border-b-0 p-0"
        style={{
          background: "#141010",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5">
          <div
            className="h-1 w-10 rounded-sm"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
        </div>
        <SheetHeader className="px-[22px] pt-2 pb-3.5">
          <SheetTitle className="text-[17px] font-bold text-white">
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="no-scrollbar overflow-y-auto px-3 pb-7">
          {options.map((opt) => {
            const id = typeof opt === "string" ? opt : opt.id;
            const label = typeof opt === "string" ? opt : opt.label;
            const active = id === value;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onPick(id);
                  onClose();
                }}
                className="tap flex w-full items-center justify-between rounded-[10px] px-4 py-3.5 text-left text-[15px]"
                style={{
                  background: active ? "rgba(255,69,0,0.1)" : "transparent",
                  color: active ? "#ff8a3d" : "#fff",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
                {active && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="#ff4500"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
