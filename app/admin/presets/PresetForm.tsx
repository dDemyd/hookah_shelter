"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TobaccoOption = {
  id: string;
  name: string;
  tobacco_brands: { name: string } | { name: string }[] | null;
};

type PresetRecord = {
  name: string;
  description: string | null;
  image_url: string | null;
  is_signature: boolean;
  is_new: boolean;
  is_active: boolean;
  sort_order: number;
  preset_mix_ingredients:
    | {
        tobacco_id: string;
        percentage: number;
      }[]
    | null;
};

type IngredientForm = {
  tobacco_id: string;
  percentage: string;
};

type PresetFormState = {
  name: string;
  description: string;
  image_url: string;
  is_signature: boolean;
  is_new: boolean;
  is_active: boolean;
  sort_order: string;
  ingredients: IngredientForm[];
};

const emptyForm: PresetFormState = {
  name: "",
  description: "",
  image_url: "",
  is_signature: true,
  is_new: false,
  is_active: true,
  sort_order: "0",
  ingredients: [],
};

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function toFormState(record: PresetRecord | null): PresetFormState {
  if (!record) return emptyForm;
  return {
    name: record.name,
    description: record.description ?? "",
    image_url: record.image_url ?? "",
    is_signature: record.is_signature,
    is_new: record.is_new,
    is_active: record.is_active,
    sort_order: String(record.sort_order),
    ingredients:
      record.preset_mix_ingredients?.map((ingredient) => ({
        tobacco_id: ingredient.tobacco_id,
        percentage: String(ingredient.percentage),
      })) ?? [],
  };
}

export function PresetForm({ presetId }: { presetId?: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const tobaccosQuery = useQuery({
    queryKey: ["admin-preset-tobaccos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tobaccos")
        .select("id,name,tobacco_brands(name)")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as unknown as TobaccoOption[];
    },
  });

  const presetQuery = useQuery({
    queryKey: ["admin-preset", presetId],
    enabled: Boolean(presetId),
    queryFn: async () => {
      if (!presetId) throw new Error("Missing preset id.");
      const { data, error } = await supabase
        .from("preset_mixes")
        .select("name,description,image_url,is_signature,is_new,is_active,sort_order,preset_mix_ingredients(tobacco_id,percentage)")
        .eq("id", presetId)
        .single();
      if (error) throw error;
      return data as PresetRecord;
    },
  });

  if (tobaccosQuery.isLoading || (presetId && presetQuery.isLoading)) {
    return <p className="text-sm text-muted-foreground">Завантаження...</p>;
  }

  if (tobaccosQuery.error || presetQuery.error) {
    return <p className="text-sm text-destructive">Не вдалося завантажити форму.</p>;
  }

  return (
    <PresetFormBody
      key={presetId ?? "new"}
      presetId={presetId}
      initialForm={toFormState(presetQuery.data ?? null)}
      tobaccos={tobaccosQuery.data ?? []}
      supabase={supabase}
    />
  );
}

function PresetFormBody({
  presetId,
  initialForm,
  tobaccos,
  supabase,
}: {
  presetId?: string;
  initialForm: PresetFormState;
  tobaccos: TobaccoOption[];
  supabase: ReturnType<typeof createSupabaseBrowserClient>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PresetFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const savePreset = useMutation({
    mutationFn: async () => {
      const ingredients = form.ingredients.map((ingredient) => ({
        tobacco_id: ingredient.tobacco_id,
        percentage: Number.parseInt(ingredient.percentage, 10),
      }));
      const total = ingredients.reduce((sum, ingredient) => sum + ingredient.percentage, 0);
      const hasInvalidIngredient = ingredients.some(
        (ingredient) => !ingredient.tobacco_id || !Number.isFinite(ingredient.percentage) || ingredient.percentage <= 0,
      );
      const duplicateCount = new Set(ingredients.map((ingredient) => ingredient.tobacco_id)).size;

      if (!form.name.trim()) throw new Error("Вкажіть назву мікса.");
      if (ingredients.length === 0 || hasInvalidIngredient) throw new Error("Додайте склад мікса.");
      if (duplicateCount !== ingredients.length) throw new Error("Один тютюн не можна додати двічі.");
      if (total !== 100) throw new Error("Сума інгредієнтів має бути 100%.");

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url.trim() || null,
        is_signature: form.is_signature,
        is_new: form.is_new,
        is_active: form.is_active,
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
      };

      const presetResult = presetId
        ? await supabase.from("preset_mixes").update(payload).eq("id", presetId).select("id").single()
        : await supabase.from("preset_mixes").insert(payload).select("id").single();

      if (presetResult.error) throw presetResult.error;
      const id = presetResult.data.id;

      const deleteResult = await supabase.from("preset_mix_ingredients").delete().eq("preset_mix_id", id);
      if (deleteResult.error) throw deleteResult.error;

      const insertResult = await supabase.from("preset_mix_ingredients").insert(
        ingredients.map((ingredient) => ({
          preset_mix_id: id,
          tobacco_id: ingredient.tobacco_id,
          percentage: ingredient.percentage,
        })),
      );
      if (insertResult.error) throw insertResult.error;
    },
    onSuccess: () => {
      window.location.assign("/admin/presets");
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося зберегти мікс.");
    },
  });

  const addIngredient = () => {
    const firstUnused = tobaccos.find(
      (tobacco) => !form.ingredients.some((ingredient) => ingredient.tobacco_id === tobacco.id),
    );
    if (!firstUnused) return;
    setForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { tobacco_id: firstUnused.id, percentage: "10" }],
    }));
  };

  const updateIngredient = (index: number, patch: Partial<IngredientForm>) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    }));
  };

  const removeIngredient = (index: number) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }));
  };

  const total = form.ingredients.reduce((sum, ingredient) => sum + (Number.parseInt(ingredient.percentage, 10) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{presetId ? "Редагування фірмового мікса" : "Новий фірмовий мікс"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Склад мікса має дорівнювати 100%.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Дані мікса</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preset-name">Назва</Label>
            <Input id="preset-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preset-order">Порядок</Label>
            <Input id="preset-order" type="number" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="preset-image">Фото URL</Label>
            <Input id="preset-image" value={form.image_url} placeholder="https://..." onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="preset-description">Опис</Label>
            <Textarea id="preset-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_signature} onChange={(event) => setForm((current) => ({ ...current, is_signature: event.target.checked }))} />
            Фірмовий
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_new} onChange={(event) => setForm((current) => ({ ...current, is_new: event.target.checked }))} />
            Новий
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
            Активний
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Склад</CardTitle>
          <Button size="sm" variant="outline" onClick={addIngredient}>
            <Plus className="size-4" />
            Додати
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.ingredients.map((ingredient, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1fr_120px_40px]">
              <select
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={ingredient.tobacco_id}
                onChange={(event) => updateIngredient(index, { tobacco_id: event.target.value })}
              >
                {tobaccos.map((tobacco) => (
                  <option key={tobacco.id} value={tobacco.id}>
                    {firstRelation(tobacco.tobacco_brands)?.name ?? "Без бренду"} · {tobacco.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                max={100}
                value={ingredient.percentage}
                onChange={(event) => updateIngredient(index, { percentage: event.target.value })}
              />
              <Button size="icon-sm" variant="ghost" aria-label="Видалити" onClick={() => removeIngredient(index)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <p className={total === 100 ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>Разом: {total}%</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button onClick={() => savePreset.mutate()} disabled={savePreset.isPending}>
              <Save className="size-4" />
              Зберегти
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/presets")}>
              Скасувати
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
