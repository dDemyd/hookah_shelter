"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database, Json } from "@/lib/supabase/types";

type SettingRow = Database["public"]["Tables"]["app_settings"]["Row"];

type SettingField = {
  key: string;
  label: string;
  description: string;
  kind: "boolean" | "number" | "text";
  /** Hint shown next to text inputs. */
  placeholder?: string;
  /** Numeric bounds for `kind: "number"`. */
  min?: number;
  max?: number;
  /** Disabled keys are shown but cannot be edited from this UI. */
  readOnly?: boolean;
};

// Every key we know about. Anything in the DB not listed here still renders
// as a generic JSON-text field at the bottom (so admin doesn't get locked out
// of values added in a future migration).
const KNOWN: SettingField[] = [
  {
    key: "accepting_orders",
    label: "Приймати замовлення",
    description:
      "Глобальний рубильник. Коли вимкнено — гості не зможуть оформити жодне замовлення.",
    kind: "boolean",
  },
  {
    key: "default_price",
    label: "Базова ціна кальяну (₴)",
    description: "Ціна повного кальяну (хукка + чаша + сервіс).",
    kind: "number",
    min: 1,
  },
  {
    key: "refill_price",
    label: "Ціна забивки (₴)",
    description: "Мікс із собою — без кальяну й заміни чаші.",
    kind: "number",
    min: 1,
  },
  {
    key: "day_loaner_price",
    label: "Ціна кальяну з собою на день (₴)",
    description:
      "Неповоротна вартість міксу/послуги для формату «кальян з собою». Залог налаштовується окремо.",
    kind: "number",
    min: 1,
  },
  {
    key: "day_loaner_deposit",
    label: "Залог за кальян з собою (₴)",
    description:
      "Поворотний залог за комплект кальяну. Зберігається в замовленні окремо від ціни.",
    kind: "number",
    min: 0,
  },
  {
    key: "overpack_price",
    label: "Доплата за оверпак (₴)",
    description:
      "Додається до базової ціни, коли гість обирає оверпак (більше тютюну, довше куриться).",
    kind: "number",
    min: 0,
  },
  {
    key: "overpack_extra_grams",
    label: "Додаткові грами при оверпаку",
    description:
      "Скільки тютюну йде понад звичайних 18 г при включеному оверпаку.",
    kind: "number",
    min: 1,
    max: 20,
  },
  {
    key: "max_ingredients_per_mix",
    label: "Максимум тютюнів у міксі",
    description:
      "Скільки слотів конструктора показувати гостю. Допустимо 3 або 4. Гість може взяти менше — це лише верхня межа.",
    kind: "number",
    min: 3,
    max: 4,
  },
  {
    key: "coal_reminder_interval_minutes",
    label: "Нагадування струсити вугілля (хв)",
    description:
      "Як часто Telegram нагадує про видані кальяни на столах. 0 вимикає нагадування.",
    kind: "number",
    min: 0,
    max: 120,
  },
  {
    key: "telegram_notifications_chat_id",
    label: "Telegram chat_id для нотифікацій",
    description:
      "ID групового чату бару. Виглядає як «-1001234567890». Беріть з @getidsbot.",
    kind: "text",
    placeholder: "-1001234567890",
  },
];

function parseStored(value: Json, kind: SettingField["kind"]): string | boolean {
  if (kind === "boolean") return value === true;
  if (kind === "number") {
    if (typeof value === "number") return String(value);
    if (typeof value === "string") return value;
    return "";
  }
  // text
  if (typeof value === "string") return value;
  if (value === null) return "";
  return String(value);
}

function serializeFor(field: SettingField, raw: string | boolean): Json {
  if (field.kind === "boolean") return raw === true;
  if (field.kind === "number") {
    const n = Number(raw);
    if (!Number.isFinite(n)) return field.min ?? 0;
    let clamped = n;
    if (field.min !== undefined) clamped = Math.max(field.min, clamped);
    if (field.max !== undefined) clamped = Math.min(field.max, clamped);
    return Math.round(clamped);
  }
  return String(raw);
}

export function SettingsClient() {
  const queryClient = useQueryClient();
  const supabase = createSupabaseBrowserClient();
  const [drafts, setDrafts] = useState<Record<string, string | boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async (): Promise<SettingRow[]> => {
      const { data, error: queryError } = await supabase
        .from("app_settings")
        .select("*")
        .order("key");
      if (queryError) throw queryError;
      return data ?? [];
    },
  });

  // Each input's value is derived: user draft if present, otherwise the stored
  // value parsed for the field's type. Cleaner than a useEffect that mirrors
  // query data into local state.
  const valueFor = (
    field: SettingField,
    row: SettingRow | undefined,
  ): string | boolean => {
    if (drafts[field.key] !== undefined) return drafts[field.key];
    if (!row) return field.kind === "boolean" ? false : "";
    return parseStored(row.value, field.kind);
  };

  const save = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      // upsert + select so we (a) create the row if a future setting was added
      // without a migration backfill, and (b) actually see what landed in the DB
      // — a plain .update() returns no rows even when RLS silently blocked it.
      const { data, error: mutationError } = await supabase
        .from("app_settings")
        .upsert({ key, value }, { onConflict: "key" })
        .select("key,value")
        .single();
      if (mutationError) throw mutationError;
      if (!data) {
        throw new Error("Збереження не повернуло рядок (можливо, бракує прав)");
      }
      return data;
    },
    onMutate: ({ key }) => {
      setSavingKey(key);
      setError(null);
    },
    onSuccess: (saved, { key }) => {
      // Patch the cache with the value the DB confirmed, then clear the draft.
      // Doing both in one render avoids the brief flicker where the input would
      // otherwise show the previous stored value between draft-clear and refetch.
      queryClient.setQueryData<SettingRow[]>(["admin-settings"], (prev) => {
        if (!prev) return prev;
        const idx = prev.findIndex((row) => row.key === key);
        if (idx === -1) {
          return [...prev, { ...(prev[0] ?? {}), ...saved } as SettingRow].sort(
            (a, b) => a.key.localeCompare(b.key),
          );
        }
        const next = prev.slice();
        next[idx] = { ...next[idx], value: saved.value };
        return next;
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSavedKey(key);
      setTimeout(
        () => setSavedKey((current) => (current === key ? null : current)),
        2000,
      );
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Не вдалося зберегти",
      );
    },
    onSettled: () => {
      setSavingKey(null);
    },
  });

  const rows = settingsQuery.data ?? [];
  const knownRows = KNOWN.map((field) => ({
    field,
    row: rows.find((r) => r.key === field.key),
  }));
  const unknownRows = rows.filter(
    (r) => !KNOWN.find((f) => f.key === r.key),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Налаштування</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Глобальні параметри застосунку. Зберігаються в таблиці{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">app_settings</code>.
          Редагувати може тільки користувач з роллю <strong>admin</strong>.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {settingsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Завантаження...</p>
      ) : null}

      <div className="grid gap-4">
        {knownRows.map(({ field, row }) => {
          const value = valueFor(field, row);
          const stored = row
            ? parseStored(row.value, field.kind)
            : field.kind === "boolean"
              ? false
              : "";
          const dirty = drafts[field.key] !== undefined && value !== stored;
          const saving = savingKey === field.key;
          const saved = savedKey === field.key;

          return (
            <div
              key={field.key}
              className="rounded-lg border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{field.label}</h2>
                    {field.readOnly ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                        read-only
                      </span>
                    ) : null}
                    {saved ? (
                      <span className="text-xs font-medium text-emerald-400">
                        Збережено
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {field.description}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    Ключ:{" "}
                    <code className="font-mono">{field.key}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {field.kind === "boolean" ? (
                    <BooleanToggle
                      value={value === true}
                      disabled={field.readOnly || saving}
                      onChange={(next) => {
                        setDrafts((prev) => ({ ...prev, [field.key]: next }));
                        if (!field.readOnly) {
                          save.mutate({
                            key: field.key,
                            value: serializeFor(field, next),
                          });
                        }
                      }}
                    />
                  ) : (
                    <Input
                      value={String(value ?? "")}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                      disabled={field.readOnly}
                      type={field.kind === "number" ? "number" : "text"}
                      min={field.kind === "number" ? field.min : undefined}
                      max={field.kind === "number" ? field.max : undefined}
                      className="w-48"
                    />
                  )}
                  {field.kind !== "boolean" && !field.readOnly ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!dirty || saving}
                      onClick={() =>
                        save.mutate({
                          key: field.key,
                          value: serializeFor(field, value ?? ""),
                        })
                      }
                    >
                      <Save className="size-4" />
                      Зберегти
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {unknownRows.length > 0 ? (
          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">Інші ключі</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Створені в БД, але не описані в UI. Редагування через Supabase Studio.
            </p>
            <div className="mt-3 grid gap-2 text-xs">
              {unknownRows.map((row) => (
                <div
                  key={row.key}
                  className="flex flex-wrap items-baseline gap-2 rounded-md bg-muted/40 px-2 py-1.5"
                >
                  <code className="font-mono text-foreground">{row.key}</code>
                  <span className="text-muted-foreground">
                    = {JSON.stringify(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BooleanToggle({
  value,
  disabled,
  onChange,
}: {
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        background: value ? "#ff4500" : "rgba(255,255,255,0.12)",
      }}
    >
      <span
        className="inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform"
        style={{
          transform: value ? "translateX(22px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}
