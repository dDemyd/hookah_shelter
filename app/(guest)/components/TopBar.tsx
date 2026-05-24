"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TopBarInner() {
  const params = useSearchParams();
  const table = params.get("table");

  return (
    <div className="relative z-10 flex items-center justify-between px-[22px] pt-14 pb-3">
      <span
        className="font-display text-[36px] font-semibold leading-none tracking-[0.2px] text-white"
        style={{ textShadow: "0 0 24px rgba(255,69,0,0.35)" }}
      >
        Сховище
      </span>

      {table && (
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1.5"
          style={{
            background: "rgba(255,69,0,0.08)",
            border: "1px solid rgba(255,69,0,0.25)",
          }}
        >
          <span
            className="inline-block size-1.5 rounded-full bg-[--color-fire]"
            style={{ background: "#ff4500", boxShadow: "0 0 8px #ff4500" }}
          />
          <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#ff8a3d]">
            Стіл&nbsp;№{table}
          </span>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  return (
    <Suspense fallback={<div className="h-[88px]" />}>
      <TopBarInner />
    </Suspense>
  );
}
