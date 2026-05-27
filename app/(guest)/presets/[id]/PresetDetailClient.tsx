"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { StrengthMeter } from "../../components/StrengthMeter";
import { fetchPresetMix } from "../preset-data";

export function PresetDetailClient({ id }: { id: string }) {
  const presetQuery = useQuery({
    queryKey: ["presets", id],
    queryFn: () => fetchPresetMix(id),
  });
  const preset = presetQuery.data;

  if (presetQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-md px-[22px] pt-8 pb-28">
        <div className="h-[360px] animate-pulse rounded-[18px] bg-white/[0.04]" />
      </div>
    );
  }

  if (!preset) {
    return (
      <div className="mx-auto w-full max-w-md px-[22px] pt-8 pb-28">
        <h1 className="text-[26px] font-extrabold text-white">Мікс не знайдено</h1>
        <Link className="mt-4 inline-flex text-[#ff8a3d]" href="/presets">
          До фірмових міксів
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-[22px] pt-8 pb-32">
      <div
        className="relative overflow-hidden rounded-[18px] px-5 pt-8 pb-6 text-white"
        style={{ background: preset.accent }}
      >
        {preset.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preset.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-50"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/8 to-black/60" />
        <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff8a3d] uppercase">
            Фірмовий мікс
          </div>
          {preset.isMixOfDay ? (
            <div className="rounded bg-[#ff4500] px-2 py-0.5 text-[9px] font-bold tracking-[1px] text-white uppercase">
              Мікс дня
            </div>
          ) : null}
        </div>
        <h1 className="mt-2 font-display text-[44px] leading-none font-semibold">
          {preset.name}
        </h1>
        <p className="mt-4 max-w-[260px] text-[14px] leading-6 text-white/72">
          {preset.desc}
        </p>
        <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
          <div>
            <div className="mb-1 text-[10px] tracking-[1.4px] text-white/45 uppercase">
              Міцність
            </div>
            <StrengthMeter value={preset.strength} />
          </div>
          <div className="text-[24px] font-extrabold text-[#ff4500]">
            {preset.price}
            <span className="text-[13px] text-white/60">₴</span>
          </div>
        </div>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-[17px] font-bold text-white">Склад</h2>
        {preset.ingredients.length > 0 ? (
          <div className="grid gap-2">
            {preset.ingredients.map((ingredient) => (
              <div
                key={ingredient.tobacco.id}
                className="flex items-center justify-between rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <div className="text-[13px] font-bold text-white">
                    {ingredient.tobacco.uname}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#888]">
                    {ingredient.tobacco.brand}
                  </div>
                </div>
                <div className="text-[15px] font-extrabold text-[#ff8a3d]">
                  {ingredient.percentage}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-[13px] text-[#aaa]">
            Склад буде підтягнуто з Supabase після заповнення preset ingredients.
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-md px-[22px]">
        <Link
          href={`/order/new?preset=${preset.id}`}
          className="tap flex h-[54px] items-center justify-center rounded-[15px] bg-[#ff4500] text-[15px] font-extrabold text-white shadow-[0_8px_28px_rgba(255,69,0,0.34)]"
        >
          Замовити цей мікс
        </Link>
      </div>
    </div>
  );
}
