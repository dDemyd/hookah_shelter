"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOBACCO_MAX_STRENGTH } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Relation<T> = T | T[] | null;

type Tobacco = {
  id: string;
  brand_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  strength: number;
  smoke: number;
  image_url: string | null;
  color: string;
  in_stock: boolean;
  is_active: boolean;
  popularity: number;
  created_at: string;
  tobacco_brands: Relation<{ name: string; is_active: boolean }>;
  flavor_categories: Relation<{ name: string }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
}

export function TobaccosClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [brandId, setBrandId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [stock, setStock] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const tobaccosQuery = useQuery({
    queryKey: ["admin-tobaccos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tobaccos")
        .select("id,brand_id,category_id,name,description,strength,smoke,image_url,color,in_stock,is_active,popularity,created_at,tobacco_brands(name,is_active),flavor_categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Tobacco[];
    },
  });

  const optionsQuery = useQuery({
    queryKey: ["admin-tobacco-list-options"],
    queryFn: async () => {
      const [brandsResult, categoriesResult] = await Promise.all([
        supabase.from("tobacco_brands").select("id,name,is_active").order("name", { ascending: true }),
        supabase.from("flavor_categories").select("id,name").order("sort_order", { ascending: true }),
      ]);
      if (brandsResult.error) throw brandsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      return { brands: brandsResult.data, categories: categoriesResult.data };
    },
  });

  const deleteTobacco = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tobaccos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-tobaccos"] });
      window.location.reload();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося видалити тютюн.");
    },
  });

  const filtered = (tobaccosQuery.data ?? []).filter((tobacco) => {
    const needle = search.trim().toLowerCase();
    const brand = firstRelation(tobacco.tobacco_brands)?.name ?? "";
    const category = firstRelation(tobacco.flavor_categories)?.name ?? "";
    const matchesSearch =
      !needle ||
      tobacco.name.toLowerCase().includes(needle) ||
      brand.toLowerCase().includes(needle) ||
      category.toLowerCase().includes(needle);
    return (
      matchesSearch &&
      (brandId === "all" || tobacco.brand_id === brandId) &&
      (categoryId === "all" || tobacco.category_id === categoryId) &&
      (stock === "all" || (stock === "in" ? tobacco.in_stock : !tobacco.in_stock))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Тютюни</h1>
          <p className="mt-1 text-sm text-muted-foreground">Флаг new рахується автоматично: перші 30 днів після додавання.</p>
        </div>
        <Link className={cn(buttonVariants(), "gap-1.5")} href="/admin/tobaccos/new">
          <Plus className="size-4" />
          Додати тютюн
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[1fr_180px_180px_140px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Пошук" />
        </label>
        <select className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm" value={brandId} onChange={(event) => setBrandId(event.target.value)}>
          <option value="all">Усі бренди</option>
          {optionsQuery.data?.brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
        <select className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="all">Усі категорії</option>
          {optionsQuery.data?.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm" value={stock} onChange={(event) => setStock(event.target.value)}>
          <option value="all">Будь-яка наявність</option>
          <option value="in">В наявності</option>
          <option value="out">Немає</option>
        </select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[72px_1fr_130px_130px_80px_80px_180px_90px] gap-3 border-b px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
            <span>Вигляд</span>
            <span>Назва</span>
            <span>Бренд</span>
            <span>Категорія</span>
            <span>Міцність</span>
            <span>Дим</span>
            <span>Статус</span>
            <span className="text-right">Дії</span>
          </div>
          {filtered.map((tobacco) => {
            const brandRecord = firstRelation(tobacco.tobacco_brands);
            const brand = brandRecord?.name ?? "Без бренду";
            const category = firstRelation(tobacco.flavor_categories)?.name ?? "Без категорії";
            return (
              <div key={tobacco.id} className="grid grid-cols-[72px_1fr_130px_130px_80px_80px_180px_90px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
                <div className="size-11 overflow-hidden rounded-md border" style={{ backgroundColor: tobacco.image_url ? undefined : tobacco.color }}>
                  {tobacco.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tobacco.image_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium">{tobacco.name}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{tobacco.description ?? "Без опису"}</p>
                </div>
                <span className="text-sm">
                  {brand}
                  {brandRecord?.is_active === false ? (
                    <span className="ml-1 text-xs text-muted-foreground">(бренд приховано)</span>
                  ) : null}
                </span>
                <span className="text-sm">{category}</span>
                <span className="text-sm">{tobacco.strength}/{TOBACCO_MAX_STRENGTH}</span>
                <span className="text-sm">{tobacco.smoke}/5</span>
                <div className="flex flex-wrap gap-1">
                  {isNew(tobacco.created_at) ? <Badge>Новий</Badge> : null}
                  <Badge variant={tobacco.in_stock ? "secondary" : "outline"}>{tobacco.in_stock ? "В наявності" : "Немає"}</Badge>
                  {!tobacco.is_active ? <Badge variant="outline">Приховано</Badge> : null}
                  {brandRecord?.is_active === false ? <Badge variant="outline">Бренд приховано</Badge> : null}
                </div>
                <div className="flex justify-end gap-1">
                  <Link
                    className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                    aria-label="Редагувати"
                    href={`/admin/tobaccos/${tobacco.id}`}
                  >
                    <Edit2 className="size-4" />
                  </Link>
                  <Button size="icon-sm" variant="ghost" aria-label="Видалити" onClick={() => deleteTobacco.mutate(tobacco.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {tobaccosQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Завантаження...</p> : null}
          {!tobaccosQuery.isLoading && filtered.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Нічого не знайдено.</p> : null}
        </div>
      </div>
    </div>
  );
}
