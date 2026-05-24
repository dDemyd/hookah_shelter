"use client";

import { toast } from "sonner";
import { useMixStore } from "@/lib/stores/mix-store";
import { MAX_INGREDIENTS_PER_MIX } from "@/lib/constants";
import type { FreshTobacco } from "../_mock-data";
import { HScroll } from "./HScroll";
import { TobaccoCard } from "./TobaccoCard";

export function FreshTobaccosRow({ items }: { items: FreshTobacco[] }) {
  const slots = useMixStore((s) => s.slots);
  const addTobacco = useMixStore((s) => s.addTobacco);
  const removeTobacco = useMixStore((s) => s.removeTobacco);

  const isPicked = (id: string) => slots.some((s) => s.tobaccoId === id);

  const toggle = (item: FreshTobacco) => {
    if (isPicked(item.id)) {
      removeTobacco(item.id);
      toast(`${item.flavor} прибрано з міксу`);
      return;
    }
    if (slots.length >= MAX_INGREDIENTS_PER_MIX) {
      toast(`Максимум ${MAX_INGREDIENTS_PER_MIX} в міксі`);
      return;
    }
    addTobacco(item.id);
    toast(`${item.flavor} додано в мікс`);
  };

  return (
    <HScroll>
      {items.map((item) => (
        <TobaccoCard
          key={item.id}
          item={item}
          added={isPicked(item.id)}
          onAdd={() => toggle(item)}
        />
      ))}
    </HScroll>
  );
}
