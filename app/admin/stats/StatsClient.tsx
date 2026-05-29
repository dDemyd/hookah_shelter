"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  type OrderStatus,
  type ServiceType,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Period = "today" | "week" | "month" | "all";

type OrderRow = {
  id: string;
  status: OrderStatus;
  service_type: ServiceType;
  price: number;
  preset_mix_id: string | null;
  accepted_by: string | null;
  created_at: string;
};

type TobaccoRow = {
  id: string;
  name: string;
  popularity: number;
  tobacco_brands: { name: string } | { name: string }[] | null;
};

type PresetRow = {
  id: string;
  name: string;
};

type StaffProfileRow = {
  id: string;
  full_name: string;
  is_active: boolean;
};

type StaffStatsRow = {
  profileId: string;
  fullName: string;
  accepted: number;
  active: number;
  delivered: number;
  closed: number;
  cancelled: number;
  revenue: number;
};

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Сьогодні" },
  { id: "week", label: "7 днів" },
  { id: "month", label: "30 днів" },
  { id: "all", label: "Весь час" },
];

const STAFF_ACTIVE_STATUSES = new Set<OrderStatus>([
  "accepted",
  "preparing",
  "ready",
]);

function startOfPeriod(period: Period): string | null {
  const d = new Date();
  if (period === "all") return null;
  if (period === "today") d.setHours(0, 0, 0, 0);
  if (period === "week") d.setDate(d.getDate() - 7);
  if (period === "month") d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function StatsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [period, setPeriod] = useState<Period>("week");
  const since = useMemo(() => startOfPeriod(period), [period]);

  // Orders within the chosen period — used for revenue, count, status mix,
  // service split, hourly distribution, and top-presets ranking.
  const ordersQuery = useQuery({
    queryKey: ["admin-stats", "orders", period],
    queryFn: async (): Promise<OrderRow[]> => {
      let query = supabase
        .from("orders")
        .select("id,status,service_type,price,preset_mix_id,accepted_by,created_at");
      if (since) query = query.gte("created_at", since);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  // Tobaccos sorted by popularity. Period filter doesn't apply here — the
  // counter on tobaccos.popularity is lifetime; if we want per-period top
  // tobaccos we'd need to scan order_ingredients (heavier query for a stat
  // that's most useful as "all-time bestsellers"). Keep it simple.
  const tobaccosQuery = useQuery({
    queryKey: ["admin-stats", "top-tobaccos"],
    queryFn: async (): Promise<TobaccoRow[]> => {
      const { data, error } = await supabase
        .from("tobaccos")
        .select("id,name,popularity,tobacco_brands(name)")
        .gt("popularity", 0)
        .order("popularity", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as unknown as TobaccoRow[];
    },
  });

  // Preset name lookup for the top-presets section.
  const presetsQuery = useQuery({
    queryKey: ["admin-stats", "presets"],
    queryFn: async (): Promise<PresetRow[]> => {
      const { data, error } = await supabase.from("preset_mixes").select("id,name");
      if (error) throw error;
      return (data ?? []) as PresetRow[];
    },
  });

  const staffQuery = useQuery({
    queryKey: ["admin-stats", "staff-profiles"],
    queryFn: async (): Promise<StaffProfileRow[]> => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id,full_name,is_active")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StaffProfileRow[];
    },
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const tobaccos = tobaccosQuery.data ?? [];
  const staffProfiles = useMemo(
    () => staffQuery.data ?? [],
    [staffQuery.data],
  );
  const presetNameById = useMemo(
    () => new Map((presetsQuery.data ?? []).map((p) => [p.id, p.name])),
    [presetsQuery.data],
  );
  const staffNameById = useMemo(
    () =>
      new Map(
        staffProfiles.map((profile) => [
          profile.id,
          profile.is_active ? profile.full_name : `${profile.full_name} · вимкн.`,
        ]),
      ),
    [staffProfiles],
  );

  // ── Aggregations ─────────────────────────────────────────────
  const totalOrders = orders.length;
  // "Served" = the hookah was actually given to the guest — both delivered
  // (currently smoking) and closed (paid + left).
  const served = orders.filter(
    (o) => o.status === "delivered" || o.status === "closed",
  );
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const revenue = served.reduce((sum, o) => sum + o.price, 0);
  const averagePrice = served.length > 0 ? Math.round(revenue / served.length) : 0;
  const cancelRate = totalOrders > 0 ? Math.round((cancelled.length / totalOrders) * 100) : 0;

  const statusCounts: Record<OrderStatus, number> = {
    pending: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    closed: 0,
    cancelled: 0,
  };
  for (const o of orders) statusCounts[o.status] += 1;

  const serviceCounts: Record<ServiceType, number> = {
    hookah: 0,
    refill: 0,
    day_loaner: 0,
  };
  for (const o of orders) serviceCounts[o.service_type] += 1;

  // Hourly distribution (0–23).
  const hourly = Array.from({ length: 24 }, () => 0);
  for (const o of orders) {
    const h = new Date(o.created_at).getHours();
    hourly[h] += 1;
  }
  const hourlyMax = Math.max(1, ...hourly);

  // Top presets by frequency in this period.
  const presetCounts = new Map<string, number>();
  for (const o of orders) {
    if (!o.preset_mix_id) continue;
    presetCounts.set(o.preset_mix_id, (presetCounts.get(o.preset_mix_id) ?? 0) + 1);
  }
  const topPresets = [...presetCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const staffStats = useMemo(() => {
    const rows = new Map<string, StaffStatsRow>();
    for (const profile of staffProfiles) {
      rows.set(profile.id, {
        profileId: profile.id,
        fullName: profile.is_active
          ? profile.full_name
          : `${profile.full_name} · вимкн.`,
        accepted: 0,
        active: 0,
        delivered: 0,
        closed: 0,
        cancelled: 0,
        revenue: 0,
      });
    }

    for (const order of orders) {
      if (!order.accepted_by) continue;
      if (!rows.has(order.accepted_by)) {
        rows.set(order.accepted_by, {
          profileId: order.accepted_by,
          fullName: staffNameById.get(order.accepted_by) ?? "Невідомий співробітник",
          accepted: 0,
          active: 0,
          delivered: 0,
          closed: 0,
          cancelled: 0,
          revenue: 0,
        });
      }

      const row = rows.get(order.accepted_by);
      if (!row) continue;
      row.accepted += 1;
      if (STAFF_ACTIVE_STATUSES.has(order.status)) row.active += 1;
      if (order.status === "delivered") row.delivered += 1;
      if (order.status === "closed") row.closed += 1;
      if (order.status === "cancelled") row.cancelled += 1;
      if (order.status === "delivered" || order.status === "closed") {
        row.revenue += order.price;
      }
    }

    return [...rows.values()]
      .filter((row) => row.accepted > 0)
      .sort(
        (a, b) =>
          b.accepted - a.accepted ||
          b.closed - a.closed ||
          b.delivered - a.delivered ||
          b.revenue - a.revenue ||
          a.fullName.localeCompare(b.fullName, "uk"),
      );
  }, [orders, staffNameById, staffProfiles]);

  const tobaccoMax = Math.max(1, ...tobaccos.map((t) => t.popularity));
  const staffMax = Math.max(1, ...staffStats.map((row) => row.accepted));
  const assignedOrders = orders.filter((order) => order.accepted_by).length;
  const tobaccosBrandLabel = (row: TobaccoRow) =>
    firstRelation(row.tobacco_brands)?.name ?? "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Статистика</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Тренди по замовленнях. Хіти каталогу — за весь час.
          </p>
        </div>
        <div className="flex gap-1.5 rounded-md border bg-muted/40 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-sm px-3 py-1 text-xs font-semibold transition-colors ${
                period === p.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Замовлень" value={totalOrders} hint="За обраний період" />
        <KpiTile
          label="Видано"
          value={served.length}
          hint={`${cancelled.length} скасовано · ${cancelRate}%`}
        />
        <KpiTile
          label="Дохід"
          value={`${revenue} ₴`}
          hint="Видані + закриті"
          accent="#ff4500"
        />
        <KpiTile
          label="Середній чек"
          value={averagePrice > 0 ? `${averagePrice} ₴` : "—"}
          hint="По виданих замовленнях"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Розподіл за статусом" subtitle="Кожен статус від pending до cancelled">
          {totalOrders === 0 ? (
            <Empty label="Немає даних" />
          ) : (
            <div className="space-y-2">
              {(Object.keys(statusCounts) as OrderStatus[]).map((status) => (
                <BarRow
                  key={status}
                  label={ORDER_STATUS_LABELS[status]}
                  value={statusCounts[status]}
                  max={totalOrders}
                  color={statusColor(status)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card title="Тип сервісу" subtitle="Кальяни проти забивок">
          {totalOrders === 0 ? (
            <Empty label="Немає даних" />
          ) : (
            <div className="space-y-2">
              <BarRow
                label={`🪔 ${SERVICE_TYPE_LABELS.hookah}`}
                value={serviceCounts.hookah}
                max={totalOrders}
                color="#ff4500"
              />
              <BarRow
                label={`🍃 ${SERVICE_TYPE_LABELS.refill}`}
                value={serviceCounts.refill}
                max={totalOrders}
                color="#10b981"
              />
              <BarRow
                label={`🎒 ${SERVICE_TYPE_LABELS.day_loaner}`}
                value={serviceCounts.day_loaner}
                max={totalOrders}
                color="#3b82f6"
              />
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Хіти каталогу"
          subtitle="Найчастіше додаються в мікси (за весь час)"
        >
          {tobaccos.length === 0 ? (
            <Empty label="Поки немає популярних тютюнів" />
          ) : (
            <div className="space-y-2">
              {tobaccos.map((t) => (
                <BarRow
                  key={t.id}
                  label={`${tobaccosBrandLabel(t)} · ${t.name}`}
                  value={t.popularity}
                  max={tobaccoMax}
                  color="#ff8a3d"
                  rightLabel={String(t.popularity)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Топ фірмових міксів"
          subtitle="Скільки разів замовили в обраний період"
        >
          {topPresets.length === 0 ? (
            <Empty label="Жодного фірмового замовлення" />
          ) : (
            <div className="space-y-2">
              {topPresets.map(([id, count]) => (
                <BarRow
                  key={id}
                  label={presetNameById.get(id) ?? "—"}
                  value={count}
                  max={topPresets[0][1]}
                  color="#ff4500"
                  rightLabel={String(count)}
                />
              ))}
            </div>
          )}
        </Card>
      </section>

      <Card
        title="Активність по годинах"
        subtitle="Скільки замовлень створено в кожну годину доби"
      >
        {totalOrders === 0 ? (
          <Empty label="Немає даних" />
        ) : (
          <div className="grid grid-cols-12 gap-1 sm:grid-cols-24">
            {hourly.map((value, hour) => (
              <div key={hour} className="flex flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end">
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${(value / hourlyMax) * 100}%`,
                      minHeight: value > 0 ? 4 : 1,
                      background:
                        value > 0
                          ? "linear-gradient(180deg, #ff8a3d, #ff4500)"
                          : "rgba(255,255,255,0.05)",
                    }}
                  />
                </div>
                <div className="text-[9px] text-muted-foreground tabular-nums">
                  {String(hour).padStart(2, "0")}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Рейтинг співробітників"
        subtitle="За accepted_by у замовленнях обраного періоду"
      >
        {staffStats.length === 0 ? (
          <Empty label="Поки немає прийнятих замовлень" />
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground sm:grid-cols-3">
              <span>
                Відповідальні:{" "}
                <b className="text-foreground tabular-nums">{assignedOrders}</b>
              </span>
              <span>
                Без відповідального:{" "}
                <b className="text-foreground tabular-nums">
                  {totalOrders - assignedOrders}
                </b>
              </span>
              <span>
                У рейтингу:{" "}
                <b className="text-foreground tabular-nums">{staffStats.length}</b>
              </span>
            </div>
            <div className="space-y-2">
              {staffStats.map((row, index) => (
                <StaffLeaderboardItem
                  key={row.profileId}
                  row={row}
                  place={index + 1}
                  max={staffMax}
                />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StaffLeaderboardItem({
  row,
  place,
  max,
}: {
  row: StaffStatsRow;
  place: number;
  max: number;
}) {
  const pct = max > 0 ? (row.accepted / max) * 100 : 0;
  return (
    <div className="rounded-md border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {place}. {row.fullName}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-5">
            <span>
              Прийнято <b className="text-foreground tabular-nums">{row.accepted}</b>
            </span>
            <span>
              В роботі <b className="text-foreground tabular-nums">{row.active}</b>
            </span>
            <span>
              Видано <b className="text-foreground tabular-nums">{row.delivered}</b>
            </span>
            <span>
              Закрито <b className="text-foreground tabular-nums">{row.closed}</b>
            </span>
            <span>
              Дохід <b className="text-foreground tabular-nums">{row.revenue} ₴</b>
            </span>
          </div>
        </div>
        <div className="shrink-0 text-lg font-extrabold tabular-nums text-[#ff4500]">
          {row.accepted}
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-sm bg-muted">
        <div
          className="h-full rounded-sm bg-[#ff4500] transition-all shadow-[0_0_8px_rgba(255,69,0,0.35)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  accent = "#ffffff",
}: {
  label: string;
  value: number | string;
  hint: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div
        className="mt-2 text-2xl font-extrabold tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-6 text-center text-xs text-muted-foreground">{label}</p>;
}

function BarRow({
  label,
  value,
  max,
  color,
  rightLabel,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  rightLabel?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="truncate text-foreground/90">{label}</span>
        <span className="ml-2 shrink-0 font-semibold tabular-nums text-muted-foreground">
          {rightLabel ?? value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-muted">
        <div
          className="h-full rounded-sm transition-all"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

function statusColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "#fbbf24";
    case "accepted":
      return "#38bdf8";
    case "preparing":
      return "#ff8a3d";
    case "ready":
      return "#10b981";
    case "delivered":
      return "#a78bfa";
    case "closed":
      return "#a3a3a3";
    case "cancelled":
      return "#f43f5e";
  }
}
