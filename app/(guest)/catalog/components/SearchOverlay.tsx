"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
};

export function SearchOverlay({ open, value, onChange, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 240);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 px-4 pt-14 pb-4 backdrop-blur-xl transition-transform duration-300"
      style={{
        background: "rgba(10,10,10,0.96)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        transform: open ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити пошук"
          className="tap flex size-10 items-center justify-center rounded-xl text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div
          className="relative flex flex-1 items-center rounded-[10px] py-2.5 pr-3 pl-[38px]"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,69,0,0.4)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-3 text-[#ff8a3d]"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M20 20l-3.5-3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Бренд, смак або категорія..."
            className="flex-1 border-none bg-transparent text-[14px] text-white outline-none placeholder:text-[#666]"
          />
        </div>
      </div>
    </div>
  );
}
