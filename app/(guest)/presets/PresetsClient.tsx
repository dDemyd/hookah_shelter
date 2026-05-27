"use client";

import { useQuery } from "@tanstack/react-query";
import { BrandedEmptyState } from "../components/BrandedEmptyState";
import { PresetListSkeleton } from "../components/GuestSkeletons";
import { MixCard } from "../components/MixCard";
import { fetchPresetMixes } from "./preset-data";

export function PresetsClient() {
  const presetsQuery = useQuery({
    queryKey: ["presets"],
    queryFn: fetchPresetMixes,
  });
  const presets = presetsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-md px-[22px] pt-8 pb-28">
      <div className="mb-5">
        <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
          Сховище
        </div>
        <h1 className="mt-1 text-[28px] leading-tight font-extrabold text-white">
          Фірмові мікси
        </h1>
      </div>

      {presets.length === 0 && presetsQuery.isLoading ? (
        <PresetListSkeleton />
      ) : presets.length === 0 ? (
        <BrandedEmptyState
          className="pt-10"
          title="Мікси готуються"
          body="Фірмові рецепти скоро з'являться тут. Поки можна зібрати власний мікс у конструкторі."
          actionHref="/mixer"
          actionLabel="Створити мікс"
        />
      ) : (
        <div className="grid gap-3">
          {presets.map((mix) => (
            <div key={mix.id} className="[&>a]:h-[220px] [&>a]:w-full">
              <MixCard mix={mix} />
            </div>
          ))}
        </div>
      )}

      {presetsQuery.isError && (
        <div className="mt-4 rounded-[10px] border border-[#ff450033] bg-[#ff45000f] px-3 py-2 text-[12px] text-[#ffb070]">
          Показую локальні фірмові мікси: Supabase зараз недоступний.
        </div>
      )}
    </div>
  );
}
