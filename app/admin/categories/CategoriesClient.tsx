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

type Category = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  sort_order: number;
};

type CategoryForm = {
  id?: string;
  name: string;
  slug: string;
  emoji: string;
  sort_order: string;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  emoji: "",
  sort_order: "0",
};

export function CategoriesClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flavor_categories")
        .select("id,name,slug,emoji,sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const reloadPage = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    window.location.reload();
  };

  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        emoji: form.emoji.trim() || null,
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
      };
      if (!payload.name || !payload.slug) {
        throw new Error("Заповніть назву та slug.");
      }
      const query = form.id
        ? supabase.from("flavor_categories").update(payload).eq("id", form.id)
        : supabase.from("flavor_categories").insert(payload);
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
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося зберегти категорію.");
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flavor_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: reloadPage,
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося видалити категорію.");
    },
  });

  const openNew = () => {
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      emoji: category.emoji ?? "",
      sort_order: String(category.sort_order),
    });
    setError(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Категорії</h1>
          <p className="mt-1 text-sm text-muted-foreground">Смакові групи для каталогу та фільтрів.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Додати категорію
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-lg border">
        <div className="grid grid-cols-[80px_1fr_160px_100px_100px] gap-3 border-b px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
          <span>Emoji</span>
          <span>Назва</span>
          <span>Slug</span>
          <span>Порядок</span>
          <span className="text-right">Дії</span>
        </div>
        {categoriesQuery.data?.map((category) => (
          <div key={category.id} className="grid grid-cols-[80px_1fr_160px_100px_100px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
            <span className="text-lg">{category.emoji ?? ""}</span>
            <span className="font-medium">{category.name}</span>
            <span className="text-sm text-muted-foreground">{category.slug}</span>
            <span className="text-sm text-muted-foreground">{category.sort_order}</span>
            <div className="flex justify-end gap-1">
              <Button size="icon-sm" variant="ghost" aria-label="Редагувати" onClick={() => openEdit(category)}>
                <Edit2 className="size-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Видалити" onClick={() => deleteCategory.mutate(category.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {categoriesQuery.isLoading ? <p className="p-4 text-sm text-muted-foreground">Завантаження...</p> : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Редагувати категорію" : "Нова категорія"}</DialogTitle>
            <DialogDescription>Категорія використовується у фільтрах каталогу та конструктора.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Назва</Label>
              <Input
                id="category-name"
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
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div className="space-y-2">
                <Label htmlFor="category-emoji">Emoji</Label>
                <Input
                  id="category-emoji"
                  value={form.emoji}
                  onChange={(event) => setForm((current) => ({ ...current, emoji: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-order">Порядок</Label>
                <Input
                  id="category-order"
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => setForm((current) => ({ ...current, sort_order: event.target.value }))}
                />
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={() => saveCategory.mutate()} disabled={saveCategory.isPending}>
              <Save className="size-4" />
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
