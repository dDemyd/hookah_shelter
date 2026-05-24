"use client";

import { useRouter } from "next/navigation";

type Props = { onSearch: () => void };

export function CatalogTopBar({ onSearch }: Props) {
  const router = useRouter();

  return (
    <div
      // Fixed across the viewport (mobile-first); inner content stays centered
      // via the `max-w-md mx-auto` wrapper below. Stays put while the page
      // scrolls beneath it.
      className="pointer-events-none fixed inset-x-0 top-0 z-30"
      style={{
        background:
          "linear-gradient(180deg, #0a0a0a 85%, rgba(10,10,10,0))",
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-14 pb-5">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Назад"
        className="tap pointer-events-auto flex size-10 items-center justify-center rounded-xl text-white"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
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
      <div className="text-center">
        <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
          Сховище
        </div>
        <div className="mt-px text-[17px] font-bold tracking-[-0.3px] text-white">
          Каталог тютюнів
        </div>
      </div>
      <button
        type="button"
        onClick={onSearch}
        aria-label="Пошук"
        className="tap pointer-events-auto flex size-10 items-center justify-center rounded-xl text-white"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      </div>
    </div>
  );
}
