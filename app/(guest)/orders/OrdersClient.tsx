"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  type OrderStatus,
  type ServiceType,
} from "@/lib/constants";
import {
  useDraftsStore,
  type Draft,
} from "@/lib/stores/drafts-store";
import { useMixStore } from "@/lib/stores/mix-store";
import {
  useOrdersHistoryStore,
} from "@/lib/stores/orders-history-store";
import {
  fetchCatalogTobaccos,
  pluralForm,
  TOBACCO_CATALOG,
  type CatalogTobacco,
} from "../catalog/_catalog-data";
import { GuestFooter } from "../components/GuestFooter";
import { ServiceSheet } from "../components/ServiceSheet";
import {
  fetchOrdersByShortCodes,
  type OrderView,
} from "../order/order-data";

type Tab = "all" | "drafts" | "ordered";

const DEFAULT_TOBACCO_COLOR = "#a06a3a";
const STATUS_TONE: Record<
  OrderStatus,
  { color: string; bg: string; border: string }
> = {
  pending: {
    color: "#ff8a3d",
    bg: "rgba(255,69,0,0.12)",
    border: "rgba(255,69,0,0.4)",
  },
  accepted: {
    color: "#ffd180",
    bg: "rgba(255,180,80,0.12)",
    border: "rgba(255,180,80,0.4)",
  },
  preparing: {
    color: "#ffb070",
    bg: "rgba(255,176,112,0.12)",
    border: "rgba(255,176,112,0.4)",
  },
  ready: {
    color: "#7ed321",
    bg: "rgba(126,211,33,0.12)",
    border: "rgba(126,211,33,0.4)",
  },
  delivered: {
    color: "#c4a7f7",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.4)",
  },
  closed: {
    color: "#8c8c8c",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.12)",
  },
  cancelled: {
    color: "#d97070",
    bg: "rgba(217,112,112,0.12)",
    border: "rgba(217,112,112,0.4)",
  },
};

type DraftPick = {
  id: string;
  brand: string;
  uname: string;
  color: string;
  strength: number;
  smoke: number;
  category: string;
  pct: number;
};

type OrderPick = {
  id: string;
  brand: string;
  uname: string;
  color: string;
  pct: number;
};

// ─────────────────────────────────────────────────────────────
export function OrdersClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [confirmDelete, setConfirmDelete] = useState<Draft | null>(null);
  const [orderingDraft, setOrderingDraft] = useState<Draft | null>(null);

  const drafts = useDraftsStore((s) => s.drafts);
  const removeDraft = useDraftsStore((s) => s.remove);
  const setSlots = useMixStore.setState;

  const history = useOrdersHistoryStore((s) => s.orders);

  const catalogQuery = useQuery({
    queryKey: ["catalog", "tobaccos"],
    queryFn: fetchCatalogTobaccos,
  });
  const catalog =
    catalogQuery.data && catalogQuery.data.length > 0
      ? catalogQuery.data
      : TOBACCO_CATALOG;
  const catalogById = useMemo(
    () => new Map(catalog.map((t) => [t.id, t])),
    [catalog],
  );

  const ordersQuery = useQuery({
    queryKey: ["orders", "by-shortcodes", history.map((o) => o.shortCode).join(",")],
    queryFn: () =>
      fetchOrdersByShortCodes(history.map((o) => o.shortCode)),
    enabled: history.length > 0,
    refetchInterval: 30_000,
  });
  // Hide terminal orders — once a kalyanchik closes (or cancels) an order it
  // shouldn't keep cluttering the guest's "Замовлення" list.
  const orders = (ordersQuery.data ?? []).filter(
    (order) => order.status !== "closed" && order.status !== "cancelled",
  );

  const counts = {
    all: drafts.length + orders.length,
    drafts: drafts.length,
    ordered: orders.length,
  };

  const editDraft = (draft: Draft) => {
    setSlots({ slots: draft.slots.map((s) => ({ ...s })) });
    router.push("/mixer");
  };

  const startOrderingDraft = (draft: Draft) => {
    // Load draft into the mix-store before opening the service sheet — when the
    // sheet confirms we'll navigate to /order/new which reads from the store.
    setSlots({ slots: draft.slots.map((s) => ({ ...s })) });
    setOrderingDraft(draft);
  };

  const confirmOrder = (serviceType: ServiceType) => {
    setOrderingDraft(null);
    router.push(`/order/new?service=${serviceType}`);
  };

  const showDrafts = tab === "all" || tab === "drafts";
  const showOrdered = tab === "all" || tab === "ordered";
  const isEmpty =
    (showDrafts ? drafts.length === 0 : true) &&
    (showOrdered ? orders.length === 0 : true);

  return (
    <div className="relative mx-auto w-full max-w-md pt-[132px] pb-28">
      {/* Top bar — fixed so it stays put while the list scrolls. */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-20"
        style={{
          background:
            "linear-gradient(180deg, #0a0a0a 85%, rgba(10,10,10,0))",
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-14 pb-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="На головну"
            className="tap pointer-events-auto flex size-10 items-center justify-center rounded-xl text-white"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
              Сховище
            </div>
            <div className="mt-px text-[17px] font-bold text-white">
              Замовлення
            </div>
          </div>
          <div className="size-10" />
        </div>
      </div>

      <FilterChips value={tab} onChange={setTab} counts={counts} />

      {isEmpty ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {showOrdered &&
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                catalogById={catalogById}
                onView={() => router.push(`/order/${order.shortCode}`)}
              />
            ))}
          {showDrafts &&
            drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                catalogById={catalogById}
                onEdit={() => editDraft(draft)}
                onOrder={() => startOrderingDraft(draft)}
                onDelete={() => setConfirmDelete(draft)}
              />
            ))}
        </div>
      )}

      <GuestFooter />

      <ServiceSheet
        open={orderingDraft !== null}
        onClose={() => setOrderingDraft(null)}
        onConfirm={confirmOrder}
      />

      <Sheet
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[40dvh] rounded-t-3xl border-x-0 border-b-0 p-0"
          style={{
            background: "#1a1410",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex justify-center pt-2.5">
            <div
              className="h-1 w-10 rounded-sm"
              style={{ background: "rgba(255,255,255,0.18)" }}
            />
          </div>
          <div className="px-[22px] pt-3 pb-2">
            <h3 className="text-[17px] font-bold text-white">
              Видалити чернетку?
            </h3>
            <p className="mt-2 text-[13px] leading-snug text-[#aaa]">
              «{confirmDelete?.name}» буде назавжди прибрано зі списку.
            </p>
          </div>
          <div className="flex gap-2 px-4 pt-3 pb-7">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="tap h-11 flex-1 rounded-[11px] bg-white/[0.06] text-[13px] font-semibold text-white"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmDelete) return;
                removeDraft(confirmDelete.id);
                toast("Чернетку видалено");
                setConfirmDelete(null);
              }}
              className="tap h-11 flex-1 rounded-[11px] text-[13px] font-bold text-white"
              style={{
                background:
                  "linear-gradient(180deg, #ff6a1f, #ff4500)",
              }}
            >
              Видалити
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter chips
function FilterChips({
  value,
  onChange,
  counts,
}: {
  value: Tab;
  onChange: (tab: Tab) => void;
  counts: Record<Tab, number>;
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "Усі" },
    { id: "drafts", label: "Чернетки" },
    { id: "ordered", label: "Замовлено" },
  ];
  return (
    <div className="no-scrollbar flex gap-[7px] overflow-x-auto px-4 pt-1 pb-3.5">
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className="tap flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold whitespace-nowrap"
            style={{
              borderColor: active ? "#ff4500" : "rgba(255,255,255,0.1)",
              background: active
                ? "linear-gradient(180deg, #ff6a1f, #ff4500)"
                : "transparent",
              color: active ? "#fff" : "#aaa",
              boxShadow: active ? "0 4px 12px rgba(255,69,0,0.35)" : undefined,
            }}
          >
            {t.label}
            <span
              className="min-w-[18px] rounded-md px-1.5 py-px text-center text-[10px] font-bold"
              style={{
                background: active
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.06)",
                color: active ? "#fff" : "#888",
              }}
            >
              {counts[t.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
function EmptyState({ tab }: { tab: Tab }) {
  const lines: Record<Tab, [string, string]> = {
    all: [
      "Ще немає міксів",
      "Збережи чернетку в конструкторі або замов готовий — і вона з'явиться тут.",
    ],
    drafts: [
      "Чернеток поки немає",
      "Збережи мікс у конструкторі, щоб повернутися до нього пізніше.",
    ],
    ordered: [
      "Замовлень поки немає",
      "Замовиш — і ми покажемо, на якому етапі бармен.",
    ],
  };
  const [title, body] = lines[tab];

  return (
    <div className="px-[22px] pt-16 pb-8 text-center">
      <div
        className="mx-auto mb-5 flex size-24 items-center justify-center rounded-full text-[40px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,69,0,0.12), transparent 70%)",
        }}
      >
        📭
      </div>
      <div className="mb-2 text-[17px] font-bold text-white">{title}</div>
      <div className="mx-auto max-w-[280px] text-[13px] leading-snug text-balance text-[#666]">
        {body}
      </div>
      <a
        href="/mixer"
        className="tap mt-5 inline-flex items-center gap-2 rounded-[14px] px-6 py-3.5 text-[14px] font-bold text-white"
        style={{
          background: "linear-gradient(180deg, #ff6a1f, #ff4500)",
          boxShadow: "0 6px 20px rgba(255,69,0,0.35)",
        }}
      >
        Створити мікс →
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Composition strip
function CompositionStrip({
  picks,
  height = 8,
}: {
  picks: { id: string; color: string; pct: number }[];
  height?: number;
}) {
  const total = picks.reduce((s, p) => s + p.pct, 0) || 1;
  return (
    <div
      className="flex overflow-hidden border"
      style={{
        height,
        borderRadius: height / 2,
        borderColor: "rgba(255,255,255,0.06)",
        background: "#0a0606",
      }}
    >
      {picks.map((p) => (
        <div
          key={p.id}
          style={{
            flex: (p.pct / total) * 100,
            background: `linear-gradient(90deg, ${p.color}cc, ${p.color})`,
            boxShadow: `inset 0 0 6px ${p.color}33`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Pick tokens (used in both card types)
function PickTokens({
  picks,
}: {
  picks: { id: string; uname: string; pct: number; color: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {picks.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 pl-1.5"
          style={{
            background: `${p.color}1a`,
            border: `1px solid ${p.color}55`,
          }}
        >
          <span
            className="size-2.5 rounded-full"
            style={{
              background: p.color,
              boxShadow: `0 0 6px ${p.color}aa`,
            }}
          />
          <span className="text-[11px] font-semibold text-white">{p.uname}</span>
          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ color: p.color }}
          >
            {p.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Draft card
function DraftCard({
  draft,
  catalogById,
  onEdit,
  onOrder,
  onDelete,
}: {
  draft: Draft;
  catalogById: Map<string, CatalogTobacco>;
  onEdit: () => void;
  onOrder: () => void;
  onDelete: () => void;
}) {
  const picks: DraftPick[] = draft.slots.map((slot) => {
    const t = catalogById.get(slot.tobaccoId);
    return {
      id: slot.tobaccoId,
      brand: t?.brand ?? "—",
      uname: t?.uname ?? "Тютюн",
      color: t?.color ?? DEFAULT_TOBACCO_COLOR,
      strength: t?.strength ?? 0,
      smoke: t?.smoke ?? 0,
      category: t?.cat ?? "—",
      pct: slot.percentage,
    };
  });
  const stats = computeStats(picks);

  return (
    <article
      className="overflow-hidden rounded-[16px]"
      style={{
        background: "#141010",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="px-4 pt-3.5 pb-3">
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-bold tracking-[-0.3px] text-white">
              {draft.name}
            </div>
            <div className="mt-0.5 text-[11px] text-[#666]">
              {picks.length}{" "}
              {pluralForm(picks.length, ["тютюн", "тютюни", "тютюнів"])} ·{" "}
              {formatTime(draft.createdAt)}
            </div>
          </div>
          <span
            className="rounded-md border px-2 py-1 text-[10px] font-bold tracking-[1.2px] whitespace-nowrap text-[#888] uppercase"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            Чернетка
          </span>
        </div>

        <CompositionStrip picks={picks} />
        <div className="mt-2.5">
          <PickTokens picks={picks} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <MiniStat icon="🔥" label="Міц" value={stats.strength} color="#ff4500" />
          <MiniStat icon="💨" label="Дим" value={stats.smoke} color="#a8b3c4" />
        </div>

        <div
          className="mt-3 flex items-center gap-2 border-t pt-3"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <button
            type="button"
            onClick={onDelete}
            aria-label="Видалити"
            className="tap flex size-9 items-center justify-center rounded-[10px] border text-[#888]"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Редагувати"
            className="tap flex size-9 items-center justify-center rounded-[10px] border text-white"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 20h4l11-11-4-4L4 16v4z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M14 5l4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onOrder}
            className="tap h-9 rounded-[10px] px-4 text-[13px] font-bold text-white"
            style={{
              background: "linear-gradient(180deg, #ff6a1f, #ff4500)",
              boxShadow: "0 4px 12px rgba(255,69,0,0.35)",
            }}
          >
            Замовити
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Order card
function OrderCard({
  order,
  catalogById,
  onView,
}: {
  order: OrderView;
  catalogById: Map<string, CatalogTobacco>;
  onView: () => void;
}) {
  const picks: OrderPick[] = order.ingredients.map((ingredient) => {
    const t = ingredient.tobaccoId
      ? catalogById.get(ingredient.tobaccoId)
      : undefined;
    return {
      id: ingredient.id,
      brand: ingredient.tobacco.brand,
      uname: t?.uname ?? ingredient.tobacco.name,
      color: t?.color ?? DEFAULT_TOBACCO_COLOR,
      pct: ingredient.percentage,
    };
  });
  const tone = STATUS_TONE[order.status];

  return (
    <article
      className="overflow-hidden rounded-[16px]"
      style={{
        background: "#141010",
        border: "1px solid rgba(255,69,0,0.25)",
        boxShadow: "0 8px 30px rgba(255,69,0,0.08)",
      }}
    >
      <div className="px-4 pt-3.5 pb-3">
        <div className="mb-3 flex items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-bold tracking-[-0.3px] text-white">
              <span className="font-mono text-[#ff8a3d]">{order.shortCode}</span>
              {order.tableId !== null && (
                <span className="ml-2 text-[12px] font-medium text-[#888]">
                  · Стіл №{order.tableId}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-[#666]">
              {picks.length}{" "}
              {pluralForm(picks.length, ["тютюн", "тютюни", "тютюнів"])} ·{" "}
              {formatTime(new Date(order.createdAt).getTime())}
            </div>
          </div>
          <span
            className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold tracking-[1.2px] whitespace-nowrap uppercase"
            style={{
              background: tone.bg,
              borderColor: tone.border,
              color: tone.color,
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background: tone.color,
                boxShadow: `0 0 6px ${tone.color}`,
              }}
            />
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        <CompositionStrip picks={picks} />
        <div className="mt-2.5">
          <PickTokens picks={picks} />
        </div>

        <div
          className="mt-3 flex items-center gap-2 border-t pt-3"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="shrink-0">
            <div className="text-[9px] font-semibold tracking-[1px] text-[#888] uppercase">
              {SERVICE_TYPE_LABELS[order.serviceType]}
            </div>
            <div className="mt-0.5 text-[18px] leading-none font-extrabold text-white">
              {order.price}
              <span className="ml-px text-[11px] opacity-70">₴</span>
            </div>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onView}
            className="tap h-9 rounded-[10px] border px-4 text-[13px] font-bold"
            style={{
              background: "rgba(255,69,0,0.1)",
              borderColor: "rgba(255,69,0,0.4)",
              color: "#ff8a3d",
            }}
          >
            Деталі
          </button>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini stat chip
function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span className="text-[11px]">{icon}</span>
      <span className="text-[10px] font-semibold tracking-[0.8px] text-[#888] uppercase">
        {label}
      </span>
      <span
        className="text-[12px] font-extrabold tabular-nums"
        style={{ color }}
      >
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Weighted mean strength + smoke.
function computeStats(picks: DraftPick[]): {
  strength: number;
  smoke: number;
} {
  if (picks.length === 0) return { strength: 0, smoke: 0 };
  const total = picks.reduce((sum, p) => sum + p.pct, 0) || 1;
  const strength =
    picks.reduce((sum, p) => sum + p.strength * p.pct, 0) / total;
  const smoke = picks.reduce((sum, p) => sum + p.smoke * p.pct, 0) / total;
  return { strength, smoke };
}

// ─────────────────────────────────────────────────────────────
// Pretty timestamp: "щойно", "5 хв тому", "HH:MM", "DD.MM HH:MM"
function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const pad = (n: number) => String(n).padStart(2, "0");
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (sameDay) {
    const mins = Math.floor((Date.now() - ts) / 60_000);
    if (mins < 1) return "щойно";
    if (mins < 60) return `${mins} хв тому`;
    return hm;
  }
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${hm}`;
}
