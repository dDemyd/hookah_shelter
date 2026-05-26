"use client";

import Link from "next/link";
import { FlaskIcon } from "../../components/Icon";
import { useMaxIngredientsPerMix } from "@/lib/hooks/use-max-ingredients";

type Props = { count: number };

/** Floating "go to mixer" button with current pick count. */
export function MixFAB({ count }: Props) {
  const max = useMaxIngredientsPerMix();
  const active = count > 0;

  return (
    <Link
      href="/mixer"
      aria-label={`Перейти в конструктор (${count} з ${max} обрано)`}
      className="tap fixed right-5 bottom-28 z-30 flex size-16 flex-col items-center justify-center rounded-full backdrop-blur-md"
      style={{
        background: active
          ? "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)"
          : "rgba(20,12,12,0.9)",
        border: `2px solid ${active ? "rgba(255,180,120,0.5)" : "rgba(255,69,0,0.5)"}`,
        color: active ? "#fff" : "#ff4500",
        animation: active ? "ember-pulse 2.6s ease-in-out infinite" : undefined,
      }}
    >
      <FlaskIcon size={20} />
      <div
        className="mt-px text-[10px] font-extrabold tracking-[0.5px]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {count}/{max}
      </div>
    </Link>
  );
}
