"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  type OrderStatus,
  type ServiceType,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ALLOWED_TRANSITIONS } from "@/lib/telegram/status-transitions";

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

type Relation<T> = T | T[] | null;

type OrderRow = {
  id: string;
  short_code: string;
  table_id: number | null;
  guest_name: string | null;
  notes: string | null;
  status: OrderStatus;
  service_type: ServiceType;
  price: number;
  created_at: string;
  preset_mixes: Relation<{ name: string }>;
  order_ingredients:
    | {
        percentage: number;
        tobacco_snapshot: { brand?: string; name?: string };
      }[]
    | null;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OrdersClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["admin-active-orders"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,short_code,table_id,guest_name,notes,status,service_type,price,created_at,preset_mixes(name),order_ingredients(percentage,tobacco_snapshot)",
        )
        .in("status", ACTIVE_STATUSES)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const cancelledReason =
        status === "cancelled" ? window.prompt("Причина скасування")?.trim() : undefined;
      if (status === "cancelled" && !cancelledReason) return;

      const response = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, cancelledReason }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не вдалося змінити статус.");
    },
    onSuccess: () => {
      setError(null);
      window.location.reload();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не вдалося змінити статус.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Замовлення</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Показані тільки активні замовлення. Після статусу “Віддано” або “Скасовано” замовлення зникає зі списку.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="size-4" />
          Оновити
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-3">
        {ordersQuery.data?.map((order) => {
          const preset = firstRelation(order.preset_mixes);
          const transitions = ALLOWED_TRANSITIONS[order.status];

          return (
            <div key={order.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">#{order.short_code}</h2>
                    <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatTime(order.created_at)} · {SERVICE_TYPE_LABELS[order.service_type]} · {order.price} грн
                    {order.table_id ? ` · Стіл ${order.table_id}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {transitions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === "cancelled" ? "destructive" : "outline"}
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: order.id, status })}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm md:grid-cols-[1fr_1fr]">
                <div>
                  <span className="text-muted-foreground">Гість: </span>
                  {order.guest_name || "Не вказано"}
                </div>
                <div>
                  <span className="text-muted-foreground">Мікс: </span>
                  {preset?.name ?? "Індивідуальний"}
                </div>
              </div>

              {order.order_ingredients?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.order_ingredients.map((ingredient, index) => (
                    <span key={`${order.id}-${index}`} className="rounded-md bg-muted px-2 py-1 text-xs">
                      {ingredient.tobacco_snapshot.brand ?? "—"} {ingredient.tobacco_snapshot.name ?? "—"} · {ingredient.percentage}%
                    </span>
                  ))}
                </div>
              ) : null}

              {order.notes ? <p className="mt-3 text-sm text-muted-foreground">{order.notes}</p> : null}
            </div>
          );
        })}
        {ordersQuery.isLoading ? <p className="text-sm text-muted-foreground">Завантаження...</p> : null}
        {!ordersQuery.isLoading && ordersQuery.data?.length === 0 ? (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">Активних замовлень немає.</p>
        ) : null}
      </div>
    </div>
  );
}
