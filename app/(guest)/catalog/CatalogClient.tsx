"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMixStore } from "@/lib/stores/mix-store";
import { useMaxIngredientsPerMix } from "@/lib/hooks/use-max-ingredients";
import {
  CAT_LABEL,
  CATALOG_CATEGORIES,
  fetchCatalogCategories,
  fetchCatalogTobaccos,
  pluralForm,
  SORT_OPTIONS,
  type CatalogTobacco,
  type SortBy,
  TOBACCO_CATALOG,
} from "./_catalog-data";
import { CatalogCard } from "./components/CatalogCard";
import { CatalogTopBar } from "./components/CatalogTopBar";
import { Chip } from "./components/Chip";
import { DetailSheet } from "./components/DetailSheet";
import { DropdownTrigger } from "./components/DropdownTrigger";
import { MixFAB } from "./components/MixFAB";
import { OptionSheet } from "./components/OptionSheet";
import { SearchOverlay } from "./components/SearchOverlay";
import { StrengthRangeSlider } from "./components/StrengthRangeSlider";
import { MAX_STRENGTH } from "@/lib/constants";

export function CatalogClient() {
  const params = useSearchParams();
  const [cat, setCat] = useState<string>(() => params.get("cat") ?? "all");
  const [newOnly, setNewOnly] = useState<boolean>(() => params.get("new") === "1");
  const [brand, setBrand] = useState<string>("Усі");
  const [strRange, setStrRange] = useState<[number, number]>([1, MAX_STRENGTH]);
  const [sortBy, setSortBy] = useState<SortBy>("popular");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState<CatalogTobacco | null>(null);
  const [brandSheet, setBrandSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  const catalogQuery = useQuery({
    queryKey: ["catalog", "tobaccos"],
    queryFn: fetchCatalogTobaccos,
  });
  const categoriesQuery = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: fetchCatalogCategories,
  });

  const catalog =
    catalogQuery.data && catalogQuery.data.length > 0
      ? catalogQuery.data
      : TOBACCO_CATALOG;
  const categories =
    categoriesQuery.data && categoriesQuery.data.length > 0
      ? categoriesQuery.data
      : CATALOG_CATEGORIES;

  const slots = useMixStore((s) => s.slots);
  const addTobacco = useMixStore((s) => s.addTobacco);
  const maxIngredients = useMaxIngredientsPerMix();
  const isPicked = (id: string) => slots.some((s) => s.tobaccoId === id);

  const brands = useMemo(
    () => ["Усі", ...Array.from(new Set(catalog.map((t) => t.brand))).sort()],
    [catalog],
  );

  const catLabel = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label])),
    [categories],
  );

  // Filtering + sorting
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = catalog.filter((t) => {
      if (newOnly && !t.isNew) return false;
      if (cat !== "all" && t.cat !== cat) return false;
      if (brand !== "Усі" && t.brand !== brand) return false;
      if (t.strength < strRange[0] || t.strength > strRange[1]) return false;
      if (q) {
        const hay = [
          t.brand,
          t.flavor,
          t.uname,
          catLabel[t.cat] ?? CAT_LABEL[t.cat] ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.uname.localeCompare(b.uname, "uk");
      if (sortBy === "strength") return b.strength - a.strength;
      // popular: in-stock first, then popularity desc
      const aScore = (a.inStock ? 1 : 0) * 100 + a.popularity;
      const bScore = (b.inStock ? 1 : 0) * 100 + b.popularity;
      return bScore - aScore;
    });
  }, [cat, newOnly, brand, strRange, sortBy, query, catalog, catLabel]);

  const addToMix = (item: CatalogTobacco) => {
    if (!item.inStock) return;
    if (isPicked(item.id)) {
      toast(`${item.uname} вже у міксі`);
      return;
    }
    if (slots.length >= maxIngredients) {
      toast(`Максимум ${maxIngredients} тютюни — звільни слот`);
      return;
    }
    addTobacco(item.id);
    toast(`${item.uname} → у мікс`);
  };

  const hasActiveFilters =
    cat !== "all" ||
    brand !== "Усі" ||
    strRange[0] !== 1 ||
    strRange[1] !== MAX_STRENGTH ||
    query !== "" ||
    newOnly;

  const resetFilters = () => {
    setCat("all");
    setBrand("Усі");
    setStrRange([1, MAX_STRENGTH]);
    setQuery("");
    setNewOnly(false);
  };

  return (
    <div className="relative mx-auto w-full max-w-md pt-[132px] pb-28">
      <CatalogTopBar onSearch={() => setSearchOpen(true)} />

      {/* Category chips */}
      <div className="no-scrollbar relative z-20 flex gap-[7px] overflow-x-auto px-4 pt-1.5 pb-3">
        <Chip active={newOnly} onClick={() => setNewOnly((v) => !v)}>
          <span className="mr-1">✦</span> Нові
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>

      {/* Brand + Sort triggers */}
      <div className="relative z-20 flex gap-[7px] px-4">
        <DropdownTrigger
          label="Бренд"
          value={brand}
          onClick={() => setBrandSheet(true)}
        />
        <DropdownTrigger
          label="Сортувати"
          value={SORT_OPTIONS.find((s) => s.id === sortBy)?.label ?? ""}
          onClick={() => setSortSheet(true)}
        />
      </div>

      {/* Strength range */}
      <div className="px-4 pt-3">
        <div
          className="rounded-[10px] px-3.5 pt-2 pb-1.5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[1.2px] text-[#888] uppercase">
              🔥 Міцність
            </span>
            <span className="text-[12px] font-bold whitespace-nowrap text-[#ff8a3d]">
              {strRange[0]} – {strRange[1]} з {MAX_STRENGTH}
            </span>
          </div>
          <StrengthRangeSlider
            value={strRange}
            onChange={setStrRange}
            min={1}
            max={MAX_STRENGTH}
          />
        </div>
      </div>

      {/* Count + reset */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="text-[12px] font-medium whitespace-nowrap text-[#888]">
          Знайдено{" "}
          <span className="font-bold text-white">{filtered.length}</span>{" "}
          {pluralForm(filtered.length, ["смак", "смаки", "смаків"])}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="tap text-[11px] font-bold tracking-[1px] text-[#ff8a3d] uppercase"
          >
            Скинути
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="px-[22px] py-16 text-center text-[#666]">
          <div className="mb-2 text-[36px] opacity-60">🪫</div>
          <div className="mb-1 text-[14px] font-semibold text-[#aaa]">
            Нічого не знайдено
          </div>
          <div className="text-[12px] text-[#666]">Спробуй послабити фільтри</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 px-4">
          {filtered.map((t) => (
            <CatalogCard
              key={t.id}
              item={t}
              picked={isPicked(t.id)}
              onAdd={addToMix}
              onOpenDetail={setDetail}
            />
          ))}
        </div>
      )}

      {catalogQuery.isError && (
        <div className="mx-4 mt-4 rounded-[10px] border border-[#ff450033] bg-[#ff45000f] px-3 py-2 text-[12px] text-[#ffb070]">
          Показую локальний каталог: Supabase зараз недоступний.
        </div>
      )}

      <div className="px-[22px] pt-6 pb-5 text-center text-[11px] tracking-[1.5px] uppercase text-[#444]">
        Сховище · Біла Церква
      </div>

      <MixFAB count={slots.length} />

      <SearchOverlay
        open={searchOpen}
        value={query}
        onChange={setQuery}
        onClose={() => setSearchOpen(false)}
      />

      <OptionSheet
        open={brandSheet}
        title="Бренд"
        options={brands}
        value={brand}
        onPick={(id) => setBrand(id)}
        onClose={() => setBrandSheet(false)}
      />
      <OptionSheet
        open={sortSheet}
        title="Сортувати"
        options={SORT_OPTIONS}
        value={sortBy}
        onPick={(id) => setSortBy(id as SortBy)}
        onClose={() => setSortSheet(false)}
      />

      <DetailSheet
        item={detail}
        picked={detail ? isPicked(detail.id) : false}
        onClose={() => setDetail(null)}
        onAdd={addToMix}
      />
    </div>
  );
}
