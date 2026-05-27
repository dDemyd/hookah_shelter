"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type PresetRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_signature: boolean;
  is_mix_of_day: boolean;
  is_new: boolean;
  is_active: boolean;
  sort_order: number;
  preset_mix_ingredients:
    | {
        percentage: number;
        tobaccos:
          | {
              name: string;
              tobacco_brands: { name: string } | { name: string }[] | null;
            }
          | null;
      }[]
    | null;
};

const ADMIN_PRESET_SELECT_WITH_MIX_OF_DAY =
  "id,name,description,image_url,is_signature,is_mix_of_day,is_new,is_active,sort_order,preset_mix_ingredients(percentage,tobaccos(name,tobacco_brands(name)))";

const ADMIN_PRESET_SELECT_LEGACY =
  "id,name,description,image_url,is_signature,is_new,is_active,sort_order,preset_mix_ingredients(percentage,tobaccos(name,tobacco_brands(name)))";

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function PresetsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  const presetsQuery = useQuery({
    queryKey: ["admin-presets"],
    queryFn: async () => {
      const result = await supabase
        .from("preset_mixes")
        .select(ADMIN_PRESET_SELECT_WITH_MIX_OF_DAY)
        .eq("is_active", true)
        .order("is_mix_of_day", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      const { data, error } = result.error
        ? await supabase
            .from("preset_mixes")
            .select(ADMIN_PRESET_SELECT_LEGACY)
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false })
        : result;

      if (error) throw error;
      return data as unknown as PresetRow[];
    },
  });

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const hardDelete = await supabase.from("preset_mixes").delete().eq("id", id);
      if (!hardDelete.error) return;

      const softDelete = await supabase.from("preset_mixes").update({ is_active: false }).eq("id", id);
      if (softDelete.error) throw softDelete.error;
    },
    onSuccess: () => {
      setError(null);
      window.location.reload();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося видалити мікс.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Фірмові мікси</h1>
          <p className="mt-1 text-sm text-muted-foreground">Створення, редагування та видалення готових міксів.</p>
        </div>
        <Link className={cn(buttonVariants(), "gap-1.5")} href="/admin/presets/new">
          <Plus className="size-4" />
          Додати мікс
        </Link>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[72px_1fr_120px_260px_90px] gap-3 border-b px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
            <span>Вигляд</span>
            <span>Мікс</span>
            <span>Порядок</span>
            <span>Склад</span>
            <span className="text-right">Дії</span>
          </div>
          {presetsQuery.data?.map((preset) => (
            <div key={preset.id} className="grid grid-cols-[72px_1fr_120px_260px_90px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
              <div className="size-11 overflow-hidden rounded-md border bg-muted">
                {preset.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preset.image_url} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1">
                  <p className="font-medium">{preset.name}</p>
                  {preset.is_mix_of_day ? <Badge>Мікс дня</Badge> : null}
                  {preset.is_signature ? <Badge variant="secondary">Фірмовий</Badge> : null}
                  {preset.is_new ? <Badge>Новий</Badge> : null}
                </div>
                <p className="line-clamp-1 text-sm text-muted-foreground">{preset.description ?? "Без опису"}</p>
              </div>
              <span className="text-sm text-muted-foreground">{preset.sort_order}</span>
              <div className="flex flex-wrap gap-1">
                {preset.preset_mix_ingredients?.map((ingredient, index) => {
                  const tobacco = ingredient.tobaccos;
                  const brand = tobacco ? firstRelation(tobacco.tobacco_brands)?.name : null;
                  return (
                    <span key={`${preset.id}-${index}`} className="rounded-md bg-muted px-2 py-1 text-xs">
                      {brand ?? "—"} {tobacco?.name ?? "—"} · {ingredient.percentage}%
                    </span>
                  );
                })}
              </div>
              <div className="flex justify-end gap-1">
                <Link
                  className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                  aria-label="Редагувати"
                  href={`/admin/presets/${preset.id}`}
                >
                  <Edit2 className="size-4" />
                </Link>
                <Button size="icon-sm" variant="ghost" aria-label="Видалити" onClick={() => deletePreset.mutate(preset.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {presetsQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Завантаження...</p> : null}
          {!presetsQuery.isLoading && presetsQuery.data?.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Фірмових міксів немає.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
