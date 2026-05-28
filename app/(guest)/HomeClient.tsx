"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, FRESH_TOBACCOS } from "./_mock-data";
import { CategoryCard } from "./components/CategoryCard";
import { FreshTobaccosRow } from "./components/FreshTobaccosRow";
import { GuestFooter } from "./components/GuestFooter";
import { Hero } from "./components/Hero";
import { HScroll } from "./components/HScroll";
import { MixCard } from "./components/MixCard";
import { SectionHeader } from "./components/SectionHeader";
import { TopBar } from "./components/TopBar";
import {
  fetchCatalogCategories,
  fetchCatalogTobaccos,
} from "./catalog/_catalog-data";
import { fetchPresetMixes } from "./presets/preset-data";

const CATEGORY_HUES: Record<string, string> = {
  berries: "#c5183a",
  citrus: "#ff8a3d",
  tropical: "#f0a523",
  orchard: "#a8b53a",
  dessert: "#c98b3c",
  candy: "#ff4d8d",
  drinks: "#7a2bb8",
  "mint-cool": "#1ec27a",
  herbal: "#5d8f4a",
  spicy: "#ff4500",
  savory: "#bd6932",
  tobacco: "#8a5a2a",
  other: "#8a8f98",
};

export function HomeClient() {
  const catalogQuery = useQuery({
    queryKey: ["catalog", "tobaccos"],
    queryFn: fetchCatalogTobaccos,
  });
  const categoriesQuery = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: fetchCatalogCategories,
  });
  const presetsQuery = useQuery({
    queryKey: ["presets"],
    queryFn: fetchPresetMixes,
  });

  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const categories = useMemo(() => {
    if (!categoriesQuery.data || categoriesQuery.data.length <= 1) return CATEGORIES;
    return categoriesQuery.data
      .filter((category) => category.id !== "all")
      .map((category) => ({
        id: category.id,
        emoji: category.emoji ?? "",
        label: category.label,
        count: catalog.filter((item) => item.cat === category.id).length,
        hue: CATEGORY_HUES[category.id] ?? "#ff8a3d",
      }))
      .filter((category) => category.count > 0);
  }, [catalog, categoriesQuery.data]);

  const categoryTotal = categories.reduce((sum, category) => sum + category.count, 0);
  const presets = presetsQuery.data ?? [];
  const freshTobaccos = (catalog.length > 0 ? catalog : [])
    .filter((item) => item.isNew || item.inStock)
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      brand: item.brand,
      flavor: item.flavor,
      strength: item.strength,
      bg: `radial-gradient(circle at 30% 30%, ${item.color}, #150d04 70%)`,
    }));

  return (
    <div className="mx-auto w-full max-w-md">
      <TopBar />
      <Hero />

      <SectionHeader
        kicker="Від закладу"
        title="Фірмові мікси бару"
        actionHref="/presets"
      />
      <HScroll>
        {presets.map((mix) => (
          <MixCard key={mix.id} mix={mix} />
        ))}
      </HScroll>

      <SectionHeader
        kicker="Каталог"
        title="Категорії смаків"
        action={`Усі ${categoryTotal}`}
        actionHref="/catalog"
      />
      <div className="grid grid-cols-2 gap-2.5 px-[22px] pt-1 pb-2">
        {(categories.length > 0 ? categories : CATEGORIES).map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>

      <SectionHeader
        kicker="Свіже"
        title="Нові смаки в каталозі"
        actionHref="/catalog?new=1"
      />
      <FreshTobaccosRow
        items={freshTobaccos.length > 0 ? freshTobaccos : FRESH_TOBACCOS}
      />

      {(catalogQuery.isError || presetsQuery.isError) && (
        <div className="mx-[22px] mt-4 rounded-[10px] border border-[#ff450033] bg-[#ff45000f] px-3 py-2 text-[12px] text-[#ffb070]">
          Частина даних показана з локального handoff, бо Supabase зараз недоступний.
        </div>
      )}

      <GuestFooter />
    </div>
  );
}
