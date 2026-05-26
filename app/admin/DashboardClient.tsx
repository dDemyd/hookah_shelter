"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  CheckCircle2,
  Flame,
  PlayCircle,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  ACTIVE_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  type OrderStatus,
  type ServiceType,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DashboardOrderRow = {
  id: string;
  short_code: string;
  status: OrderStatus;
  service_type: ServiceType;
  price: number;
  table_id: number | null;
  guest_name: string | null;
  created_at: string;
};


function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  accepted: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  preparing: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  ready: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  // "delivered" = guest is actively smoking. Highlighted in violet so it
  // visually pops from the resolved-grey "closed".
  delivered: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  closed: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export function DashboardClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const todayIso = useMemo(() => startOfToday(), []);

  const todayQuery = useQuery({
    queryKey: ["admin-dashboard", "today", todayIso],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,short_code,status,service_type,price,table_id,guest_name,created_at",
        )
        .gte("created_at", todayIso)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DashboardOrderRow[];
    },
  });

  const activeQuery = useQuery({
    queryKey: ["admin-dashboard", "active"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ACTIVE_ORDER_STATUSES);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const readyQuery = useQuery({
    queryKey: ["admin-dashboard", "ready"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "ready");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const today = todayQuery.data ?? [];

  // Revenue counts served orders — both currently-smoking (delivered) and
  // already-left (closed). In-progress ones are still "expected" and excluded.
  const revenue = today
    .filter(
      (order) => order.status === "delivered" || order.status === "closed",
    )
    .reduce((sum, order) => sum + order.price, 0);
  const ordersToday = today.length;
  const cancelledToday = today.filter((order) => order.status === "cancelled").length;
  const inProgress = activeQuery.data ?? 0;
  const readyCount = readyQuery.data ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Дашборд</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Швидкий зріз дня. Дані оновлюються кожні 15–30 секунд.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {new Intl.DateTimeFormat("uk-UA", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </Badge>
      </div>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          icon={<ClipboardList className="size-5" />}
          label="Замовлень сьогодні"
          value={ordersToday}
          hint={
            cancelledToday > 0
              ? `${cancelledToday} скасовано`
              : "Без скасувань"
          }
        />
        <KpiTile
          icon={<PlayCircle className="size-5" />}
          label="В роботі"
          value={inProgress}
          hint="Очікують, готуються, видані, ще не закриті"
          accent="#ff8a3d"
        />
        <KpiTile
          icon={<CheckCircle2 className="size-5" />}
          label="Готові до видачі"
          value={readyCount}
          hint={readyCount > 0 ? "Чекають кальянщика" : "—"}
          accent="#10b981"
        />
        <KpiTile
          icon={<Wallet className="size-5" />}
          label="Дохід сьогодні"
          value={`${revenue} ₴`}
          hint="Лише видані замовлення"
          accent="#ff4500"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card lg:col-span-2">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Останні замовлення</h2>
              <p className="text-xs text-muted-foreground">Сьогодні, від найновішого</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Всі активні <ArrowRight className="size-3" />
            </Link>
          </header>
          <div className="divide-y">
            {todayQuery.isLoading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Завантаження...
              </p>
            ) : null}
            {!todayQuery.isLoading && today.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Сьогодні поки немає замовлень.
              </p>
            ) : null}
            {today.slice(0, 8).map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders`}
                className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="font-mono text-sm font-semibold">
                  #{order.short_code}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="truncate">
                    {order.guest_name || "Без імені"}
                    {order.table_id ? ` · Стіл ${order.table_id}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {SERVICE_TYPE_LABELS[order.service_type]} · {order.price} ₴ ·{" "}
                    {formatTime(order.created_at)}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${STATUS_TONE[order.status]}`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <QuickLink
            href="/admin/orders"
            icon={<ClipboardList className="size-4" />}
            label="Замовлення"
            description="Прийняти, готувати, віддати"
          />
          <QuickLink
            href="/admin/tobaccos"
            icon={<Flame className="size-4" />}
            label="Каталог тютюнів"
            description="Додати/прибрати з наявності"
          />
          <QuickLink
            href="/admin/presets"
            icon={<Sparkles className="size-4" />}
            label="Фірмові мікси"
            description="Скласти або відредагувати"
          />
          <QuickLink
            href="/admin/settings"
            icon={<Settings className="size-4" />}
            label="Налаштування"
            description="Ціни, прийом замовлень, Telegram"
          />
        </aside>
      </section>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  hint,
  accent = "#888",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-muted/40"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{description}</div>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
