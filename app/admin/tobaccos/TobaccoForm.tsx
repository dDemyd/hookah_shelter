"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TOBACCO_MAX_STRENGTH } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BrandOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

type TobaccoRecord = {
  brand_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  strength: number;
  smoke: number;
  image_url: string | null;
  color: string | null;
  in_stock: boolean;
  is_active: boolean;
  popularity: number;
};

type TobaccoFormState = {
  brand_id: string;
  category_id: string;
  name: string;
  description: string;
  strength: string;
  smoke: string;
  image_url: string;
  color: string;
  in_stock: boolean;
  is_active: boolean;
  popularity: string;
};

const emptyForm: TobaccoFormState = {
  brand_id: "",
  category_id: "",
  name: "",
  description: "",
  strength: "3",
  smoke: "4",
  image_url: "",
  color: "#ff4500",
  in_stock: true,
  is_active: true,
  popularity: "0",
};

function toFormState(record: TobaccoRecord | null, firstBrandId: string): TobaccoFormState {
  if (!record) {
    return { ...emptyForm, brand_id: firstBrandId };
  }

  return {
    brand_id: record.brand_id,
    category_id: record.category_id ?? "",
    name: record.name,
    description: record.description ?? "",
    strength: String(record.strength),
    smoke: String(record.smoke),
    image_url: record.image_url ?? "",
    color: record.color ?? "#ff4500",
    in_stock: record.in_stock,
    is_active: record.is_active,
    popularity: String(record.popularity),
  };
}

export function TobaccoForm({ tobaccoId }: { tobaccoId?: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const optionsQuery = useQuery({
    queryKey: ["admin-tobacco-form-options"],
    queryFn: async () => {
      const [brandsResult, categoriesResult] = await Promise.all([
        supabase.from("tobacco_brands").select("id,name").order("name", { ascending: true }),
        supabase.from("flavor_categories").select("id,name").order("sort_order", { ascending: true }),
      ]);
      if (brandsResult.error) throw brandsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;
      return {
        brands: brandsResult.data as BrandOption[],
        categories: categoriesResult.data as CategoryOption[],
      };
    },
  });

  const tobaccoQuery = useQuery({
    queryKey: ["admin-tobacco", tobaccoId],
    enabled: Boolean(tobaccoId),
    queryFn: async () => {
      if (!tobaccoId) throw new Error("Missing tobacco id.");
      const { data, error } = await supabase
        .from("tobaccos")
        .select("brand_id,category_id,name,description,strength,smoke,image_url,color,in_stock,is_active,popularity")
        .eq("id", tobaccoId)
        .single();
      if (error) throw error;
      return data as TobaccoRecord;
    },
  });

  if (optionsQuery.isLoading || (tobaccoId && tobaccoQuery.isLoading)) {
    return <p className="text-sm text-muted-foreground">Завантаження...</p>;
  }

  if (optionsQuery.error || tobaccoQuery.error) {
    return <p className="text-sm text-destructive">Не вдалося завантажити форму.</p>;
  }

  const initialForm = toFormState(tobaccoQuery.data ?? null, optionsQuery.data?.brands[0]?.id ?? "");

  return (
    <TobaccoFormBody
      key={tobaccoId ?? "new"}
      tobaccoId={tobaccoId}
      initialForm={initialForm}
      brands={optionsQuery.data?.brands ?? []}
      categories={optionsQuery.data?.categories ?? []}
      supabase={supabase}
    />
  );
}

function TobaccoFormBody({
  tobaccoId,
  initialForm,
  brands,
  categories,
  supabase,
}: {
  tobaccoId?: string;
  initialForm: TobaccoFormState;
  brands: BrandOption[];
  categories: CategoryOption[];
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<TobaccoFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const saveTobacco = useMutation({
    mutationFn: async () => {
      const payload = {
        brand_id: form.brand_id,
        category_id: form.category_id || null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        strength: Number.parseInt(form.strength, 10),
        smoke: Number.parseInt(form.smoke, 10),
        image_url: form.image_url.trim() || null,
        color: form.color,
        in_stock: form.in_stock,
        is_active: form.is_active,
        popularity: Number.parseInt(form.popularity, 10) || 0,
      };

      if (
        !payload.brand_id ||
        !payload.name ||
        payload.strength < 1 ||
        payload.strength > TOBACCO_MAX_STRENGTH ||
        payload.smoke < 1 ||
        payload.smoke > 5
      ) {
        throw new Error(`Заповніть бренд, назву, міцність (1–${TOBACCO_MAX_STRENGTH}) і димність (1–5).`);
      }

      const query = tobaccoId
        ? supabase.from("tobaccos").update(payload).eq("id", tobaccoId)
        : supabase.from("tobaccos").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      window.location.assign("/admin/tobaccos");
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося зберегти тютюн.");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{tobaccoId ? "Редагування тютюну" : "Новий тютюн"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Фото задається URL, базовий колір використовується як fallback у каталозі та конструкторі.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Дані смаку</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tobacco-name">Назва</Label>
              <Input id="tobacco-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tobacco-brand">Бренд</Label>
              <select
                id="tobacco-brand"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={form.brand_id}
                onChange={(event) => setForm((current) => ({ ...current, brand_id: event.target.value }))}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tobacco-category">Категорія</Label>
              <select
                id="tobacco-category"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={form.category_id}
                onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
              >
                <option value="">Без категорії</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tobacco-strength">Міцність</Label>
              <Input id="tobacco-strength" type="number" min={1} max={TOBACCO_MAX_STRENGTH} value={form.strength} onChange={(event) => setForm((current) => ({ ...current, strength: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tobacco-smoke">Димність</Label>
              <Input id="tobacco-smoke" type="number" min={1} max={5} value={form.smoke} onChange={(event) => setForm((current) => ({ ...current, smoke: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tobacco-image">Фото URL</Label>
              <Input id="tobacco-image" value={form.image_url} placeholder="https://..." onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tobacco-description">Опис</Label>
              <Textarea id="tobacco-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tobacco-color">Базовий колір</Label>
              <div className="flex items-center gap-2">
                <Input id="tobacco-color" type="color" className="h-8 w-14 p-1" value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} />
                <Input value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tobacco-popularity">Популярність</Label>
              <Input id="tobacco-popularity" type="number" min={0} value={form.popularity} onChange={(event) => setForm((current) => ({ ...current, popularity: event.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.in_stock} onChange={(event) => setForm((current) => ({ ...current, in_stock: event.target.checked }))} />
              В наявності
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
              Активний у каталозі
            </label>
            {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={() => saveTobacco.mutate()} disabled={saveTobacco.isPending}>
                <Save className="size-4" />
                Зберегти
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/tobaccos")}>
                Скасувати
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Превʼю</Label>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted" style={{ backgroundColor: form.image_url ? undefined : form.color }}>
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-white drop-shadow">{form.name || "Колір"}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
