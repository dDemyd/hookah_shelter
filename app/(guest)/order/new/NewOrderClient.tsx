"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_PRICES,
  type ServiceType,
} from "@/lib/constants";
import { useMixStore } from "@/lib/stores/mix-store";
import { useOrdersHistoryStore } from "@/lib/stores/orders-history-store";
import { getGuestId } from "@/lib/utils/guest-id";
import {
  fetchCatalogTobaccos,
  TOBACCO_CATALOG,
} from "../../catalog/_catalog-data";
import { fetchPresetMix } from "../../presets/preset-data";

type SubmitState = "idle" | "submitting";

function parseServiceType(value: string | null): ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value ?? "")
    ? (value as ServiceType)
    : "hookah";
}

export function NewOrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");
  const serviceType = parseServiceType(searchParams.get("service"));
  const slots = useMixStore((state) => state.slots);
  const tableId = useMixStore((state) => state.tableId);
  const clear = useMixStore((state) => state.clear);
  const recordSubmittedOrder = useOrdersHistoryStore((state) => state.add);
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [notes, setNotes] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const catalogQuery = useQuery({
    queryKey: ["catalog", "tobaccos"],
    queryFn: fetchCatalogTobaccos,
    enabled: !presetId,
  });
  const presetQuery = useQuery({
    queryKey: ["presets", presetId],
    queryFn: () => fetchPresetMix(presetId!),
    enabled: Boolean(presetId),
  });
  const catalog =
    catalogQuery.data && catalogQuery.data.length > 0
      ? catalogQuery.data
      : TOBACCO_CATALOG;

  const customItems = useMemo(
    () =>
      slots
        .map((slot) => ({
          slot,
          tobacco: catalog.find((item) => item.id === slot.tobaccoId),
        }))
        .filter((item) => item.tobacco),
    [catalog, slots],
  );
  const preset = presetQuery.data;
  const canSubmit =
    submitState === "idle" &&
    (presetId ? Boolean(preset?.ingredients.length) : customItems.length > 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitState("submitting");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId,
        guestId: getGuestId() ?? undefined,
        guestName,
        guestContact,
        notes,
        serviceType,
        presetMixId: presetId ?? undefined,
        ingredients: presetId
          ? undefined
          : slots.map((slot) => ({
              tobaccoId: slot.tobaccoId,
              percentage: slot.percentage,
            })),
      }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      toast(payload?.error ?? "Не вдалося створити замовлення");
      setSubmitState("idle");
      return;
    }

    if (!presetId) clear();
    if (payload?.shortCode) recordSubmittedOrder(payload.shortCode);
    router.push(`/order/${payload.shortCode}`);
  }

  return (
    <div className="mx-auto w-full max-w-md px-[22px] pt-7 pb-32">
      <div className="mb-5">
        <div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
          Замовлення
        </div>
        <h1 className="mt-1 text-[28px] leading-tight font-extrabold text-white">
          Підтвердження
        </h1>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-[#888]">
          <span>{tableId ? `Стіл №${tableId}` : "Стіл не вказано"}</span>
          <span aria-hidden>·</span>
          <span className="text-white">
            {serviceType === "refill" ? "🍃" : "🪔"}{" "}
            {SERVICE_TYPE_LABELS[serviceType]}{" "}
            <span className="font-bold text-[#ff8a3d]">
              {SERVICE_TYPE_PRICES[serviceType]}₴
            </span>
          </span>
        </div>
      </div>

      <section className="rounded-[14px] border border-white/[0.06] bg-[#141010] p-4">
        <h2 className="mb-3 text-[16px] font-bold text-white">Склад</h2>
        {presetId ? (
          preset ? (
            <div>
              <div className="text-[15px] font-extrabold text-white">{preset.name}</div>
              <div className="mt-1 text-[12px] text-[#888]">{preset.desc}</div>
              <div className="mt-3 grid gap-2">
                {preset.ingredients.map((ingredient) => (
                  <div
                    key={ingredient.tobacco.id}
                    className="flex justify-between text-[13px]"
                  >
                    <span className="text-[#aaa]">
                      {ingredient.tobacco.brand} {ingredient.tobacco.uname}
                    </span>
                    <span className="font-bold text-[#ff8a3d]">
                      {ingredient.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-[#888]">Завантажую мікс...</div>
          )
        ) : customItems.length > 0 ? (
          <div className="grid gap-2">
            {customItems.map(({ slot, tobacco }) => (
              <div key={slot.tobaccoId} className="flex justify-between text-[13px]">
                <span className="text-[#aaa]">
                  {tobacco?.brand} {tobacco?.uname}
                </span>
                <span className="font-bold text-[#ff8a3d]">{slot.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[13px] text-[#888]">
            У конструкторі ще немає тютюнів.
          </div>
        )}
      </section>

      <form onSubmit={submit} className="mt-5 grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-[12px] font-bold tracking-[1px] text-[#888] uppercase">
            Ім&apos;я
          </span>
          <input
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Як до вас звертатись"
            className="h-12 rounded-[12px] border border-white/[0.08] bg-white/[0.04] px-4 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-[#ff4500]"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-bold tracking-[1px] text-[#888] uppercase">
            Контакт
          </span>
          <input
            value={guestContact}
            onChange={(event) => setGuestContact(event.target.value)}
            placeholder="Телефон або Telegram"
            className="h-12 rounded-[12px] border border-white/[0.08] bg-white/[0.04] px-4 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-[#ff4500]"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[12px] font-bold tracking-[1px] text-[#888] uppercase">
            Коментар
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Побажання до кальяну"
            rows={4}
            className="resize-none rounded-[12px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#555] focus:border-[#ff4500]"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="tap mt-2 h-[54px] rounded-[15px] text-[15px] font-extrabold text-white disabled:text-[#666]"
          style={{
            background: canSubmit
              ? "linear-gradient(180deg, #ff6a1f, #ff4500)"
              : "rgba(255,255,255,0.08)",
            boxShadow: canSubmit
              ? "0 8px 28px rgba(255,69,0,0.34)"
              : undefined,
          }}
        >
          {submitState === "submitting" ? "Надсилаю..." : "Підтвердити"}
        </button>
      </form>
    </div>
  );
}
