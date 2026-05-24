"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchOrderByCode } from "../order-data";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivered",
];

const STATUS_COPY: Record<OrderStatus, string> = {
  pending: "Замовлення надіслано. Чекаємо підтвердження кальянщика.",
  accepted: "Замовлення прийнято. Скоро почнемо готувати.",
  preparing: "Кальян готується. Орієнтовно 15 хвилин.",
  ready: "Кальян готовий і скоро буде у вас.",
  delivered: "Замовлення віддано. Гарного диму.",
  cancelled: "Замовлення скасовано. Зверніться до персоналу.",
};

export function OrderStatusClient({ code }: { code: string }) {
  const normalizedCode = code.toUpperCase();
  const orderQuery = useQuery({
    queryKey: ["orders", normalizedCode],
    queryFn: () => fetchOrderByCode(normalizedCode),
    refetchInterval: 30_000,
  });
  const order = orderQuery.data;

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`order:${normalizedCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `short_code=eq.${normalizedCode}`,
        },
        () => {
          void orderQuery.refetch();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [normalizedCode, orderQuery]);

  if (orderQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-md px-[22px] pt-8 pb-28">
        <div className="h-[280px] animate-pulse rounded-[16px] bg-white/[0.04]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-md px-[22px] pt-8 pb-28">
        <h1 className="text-[26px] font-extrabold text-white">
          Замовлення не знайдено
        </h1>
        <p className="mt-2 text-[13px] text-[#888]">
          Перевірте код або зверніться до персоналу.
        </p>
        <Link className="mt-5 inline-flex text-[#ff8a3d]" href="/">
          На головну
        </Link>
      </div>
    );
  }

  const activeIndex =
    order.status === "cancelled"
      ? -1
      : STATUS_STEPS.indexOf(order.status);

  return (
    <div className="mx-auto w-full max-w-md px-[22px] pt-8 pb-28">
      <div className="rounded-[18px] border border-white/[0.06] bg-[#141010] p-5">
        <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
          Замовлення
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h1 className="text-[34px] leading-none font-extrabold text-white">
            {order.shortCode}
          </h1>
          <div className="rounded-full border border-[#ff450044] bg-[#ff450012] px-3 py-1 text-[12px] font-bold text-[#ffb070]">
            {ORDER_STATUS_LABELS[order.status]}
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-6 text-[#aaa]">
          {STATUS_COPY[order.status]}
        </p>
        {order.tableId && (
          <div className="mt-3 text-[13px] font-bold text-white/80">
            Стіл №{order.tableId}
          </div>
        )}
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-[17px] font-bold text-white">Прогрес</h2>
        <div className="grid gap-2">
          {STATUS_STEPS.map((status, index) => {
            const done = activeIndex >= index;
            return (
              <div
                key={status}
                className="flex items-center gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-4 py-3"
              >
                <div
                  className="size-3 rounded-full"
                  style={{
                    background: done ? "#ff4500" : "rgba(255,255,255,0.12)",
                    boxShadow: done ? "0 0 10px rgba(255,69,0,0.6)" : undefined,
                  }}
                />
                <div className={done ? "text-white" : "text-[#666]"}>
                  {ORDER_STATUS_LABELS[status]}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[17px] font-bold text-white">Склад</h2>
        <div className="grid gap-2">
          {order.ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex items-center justify-between rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-4 py-3"
            >
              <div>
                <div className="text-[13px] font-bold text-white">
                  {ingredient.tobacco.name}
                </div>
                <div className="mt-0.5 text-[11px] text-[#888]">
                  {ingredient.tobacco.brand}
                </div>
              </div>
              <div className="text-[15px] font-extrabold text-[#ff8a3d]">
                {ingredient.percentage}%
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
