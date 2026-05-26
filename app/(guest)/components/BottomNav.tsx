"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDraftsStore } from "@/lib/stores/drafts-store";
import { useMixStore } from "@/lib/stores/mix-store";
import { useOrdersHistoryStore } from "@/lib/stores/orders-history-store";
import { cn } from "@/lib/utils";
import { fetchOrdersByShortCodes } from "../order/order-data";
import { HomeIcon, GridIcon, FlaskIcon, MixesIcon, ReceiptIcon } from "./Icon";

const tabs = [
  { href: "/", label: "Головна", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/catalog", label: "Каталог", icon: GridIcon, match: (p: string) => p.startsWith("/catalog") },
  { href: "/presets", label: "Мікси", icon: MixesIcon, match: (p: string) => p.startsWith("/presets") },
  { href: "/mixer", label: "Конструктор", icon: FlaskIcon, match: (p: string) => p.startsWith("/mixer") },
  { href: "/orders", label: "Замовлення", icon: ReceiptIcon, match: (p: string) => p.startsWith("/orders") || p.startsWith("/order") },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Zustand persist hydrates from localStorage asynchronously. To avoid
  // SSR/client mismatch (server has no store, client does once hydrated) we
  // gate badge rendering until after first client render. useSyncExternalStore
  // gives us this cleanly without an effect+setState dance.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getMountedSnapshot,
    getServerSnapshot,
  );

  const mixCount = useMixStore((s) => s.slots.length);
  const draftCount = useDraftsStore((s) => s.drafts.length);
  const history = useOrdersHistoryStore((s) => s.orders);

  // Share the cache key with OrdersClient so we don't double-fetch when the
  // user navigates there. Badge counts only "needs attention" orders — once a
  // kalyanchik delivers, closes or cancels the order it shouldn't keep
  // pulsing in the bottom nav.
  const ordersQuery = useQuery({
    queryKey: [
      "orders",
      "by-shortcodes",
      history.map((o) => o.shortCode).join(","),
    ],
    queryFn: () =>
      fetchOrdersByShortCodes(history.map((o) => o.shortCode)),
    enabled: mounted && history.length > 0,
    refetchInterval: 30_000,
  });
  const activeOrdersCount = (ordersQuery.data ?? []).filter(
    (order) =>
      order.status !== "delivered" &&
      order.status !== "closed" &&
      order.status !== "cancelled",
  ).length;

  const badgeFor = (href: string): number => {
    if (!mounted) return 0;
    if (href === "/mixer") return mixCount;
    if (href === "/orders") return draftCount + activeOrdersCount;
    return 0;
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t pb-[18px] backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.92) 30%, #0a0a0a 100%)",
        borderColor: "rgba(255,255,255,0.05)",
      }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 pt-2.5 pb-1.5">
        {tabs.map(({ href, label, icon: IconC, match }) => {
          const active = match(pathname);
          const badge = badgeFor(href);
          return (
            <li key={href} className="relative">
              {active && (
                <span
                  className="absolute top-0 left-[30%] right-[30%] h-0.5 rounded-sm"
                  style={{ background: "#ff4500", boxShadow: "0 0 10px #ff4500" }}
                />
              )}
              <Link
                href={href}
                className={cn(
                  "tap flex flex-col items-center gap-1 px-1 pt-2.5 pb-1.5 text-[10px] font-semibold tracking-[0.2px] transition-colors",
                  active ? "text-[#ff4500]" : "text-[#666] hover:text-white",
                )}
              >
                <span className="relative">
                  {href === "/" ? (
                    <HomeIcon size={22} filled={active} />
                  ) : (
                    <IconC size={22} />
                  )}
                  {badge > 0 && <NavBadge value={badge} />}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const subscribeNoop = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

function NavBadge({ value }: { value: number }) {
  const label = value > 99 ? "99+" : String(value);
  return (
    <span
      aria-hidden
      className="absolute -top-1.5 -right-2.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] leading-none font-bold text-white tabular-nums"
      style={{
        background:
          "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)",
        boxShadow:
          "0 0 0 2px #0a0a0a, 0 0 8px rgba(255,69,0,0.55)",
      }}
    >
      {label}
    </span>
  );
}
