"use client";

import type { ReactNode } from "react";

type Props = {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
};

export function Chip({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap shrink-0 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors duration-200"
      style={{
        borderColor: active ? "#ff4500" : "rgba(255,255,255,0.1)",
        background: active
          ? "linear-gradient(180deg, #ff6a1f, #ff4500)"
          : "transparent",
        color: active ? "#fff" : "#aaa",
        boxShadow: active ? "0 4px 12px rgba(255,69,0,0.35)" : undefined,
      }}
    >
      {children}
    </button>
  );
}
