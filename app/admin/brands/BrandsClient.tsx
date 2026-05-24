"use client";

import { useMemo, useState } from "react";
import { Edit2, Plus, Save, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/slugify";

type Brand = {
  id: string;
  name: string;
  slug: string;
};

type BrandForm = {
  id?: string;
  name: string;
  slug: string;
};

const emptyForm: BrandForm = {
  name: "",
  slug: "",
};

export function BrandsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandsQuery = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tobacco_brands")
        .select("id,name,slug")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Brand[];
    },
  });

  const reloadPage = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    window.location.reload();
  };

  const saveBrand = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
      };
      if (!payload.name || !payload.slug) {
        throw new Error("Заповніть назву та slug.");
      }
      const query = form.id
        ? supabase.from("tobacco_brands").update(payload).eq("id", form.id)
        : supabase.from("tobacco_brands").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setForm(emptyForm);
      setError(null);
      await reloadPage();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося зберегти бренд.");
    },
  });

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tobacco_brands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: reloadPage,
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося видалити бренд.");
    },
  });

  const openNew = () => {
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setForm({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    });
    setError(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Бренди</h1>
          <p className="mt-1 text-sm text-muted-foreground">Керування виробниками тютюну.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Додати бренд
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr_180px_100px] gap-3 border-b px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
          <span>Бренд</span>
          <span>Slug</span>
          <span className="text-right">Дії</span>
        </div>
        {brandsQuery.data?.map((brand) => (
          <div key={brand.id} className="grid grid-cols-[1fr_180px_100px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <p className="font-medium">{brand.name}</p>
            <span className="text-sm text-muted-foreground">{brand.slug}</span>
            <div className="flex justify-end gap-1">
              <Button size="icon-sm" variant="ghost" aria-label="Редагувати" onClick={() => openEdit(brand)}>
                <Edit2 className="size-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Видалити" onClick={() => deleteBrand.mutate(brand.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {brandsQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Завантаження...</p> : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Редагувати бренд" : "Новий бренд"}</DialogTitle>
            <DialogDescription>Для бренду потрібні тільки назва та slug.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Назва</Label>
              <Input
                id="brand-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.id ? current.slug : slugify(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-slug">Slug</Label>
              <Input
                id="brand-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={() => saveBrand.mutate()} disabled={saveBrand.isPending}>
              <Save className="size-4" />
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
