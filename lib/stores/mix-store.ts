import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  MAX_INGREDIENTS_PER_MIX,
  MIN_PERCENT_PER_SLOT,
} from "@/lib/constants";

export type MixSlot = {
  tobaccoId: string;
  percentage: number;
};

type MixStore = {
  slots: MixSlot[];
  tableId: number | null;
  addTobacco: (tobaccoId: string) => void;
  removeTobacco: (tobaccoId: string) => void;
  setPercentage: (tobaccoId: string, pct: number) => void;
  setTableId: (tableId: number | null) => void;
  clear: () => void;
  /** Convenience: true if a tobacco is already in the mix. */
  hasTobacco: (tobaccoId: string) => boolean;
};

/**
 * Even-split N slots over 100% while honoring MIN_PERCENT_PER_SLOT.
 * Remainder lands on the first slot — keeps totals at exactly 100.
 */
function redistribute(slots: MixSlot[]): MixSlot[] {
  if (slots.length === 0) return [];
  const even = Math.floor(100 / slots.length);
  const remainder = 100 - even * slots.length;
  return slots.map((s, i) => ({
    ...s,
    percentage: Math.max(MIN_PERCENT_PER_SLOT, even + (i === 0 ? remainder : 0)),
  }));
}

/**
 * Spread `total` across `weights.length` slots proportionally to weights,
 * guaranteeing every slot ≥ MIN_PERCENT_PER_SLOT. Returns integer values
 * summing to exactly `total`.
 *
 * Implementation: give every slot the floor first, then distribute the
 * residual by largest fractional weight (largest-remainder method).
 */
function distribute(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];

  const min = MIN_PERCENT_PER_SLOT;
  const reservedMin = min * weights.length;

  // Caller is expected to pass total ≥ reservedMin (this is enforced upstream
  // in rebalanceFixedSlot by clamping the fixed slot). Bail safely if not.
  if (total < reservedMin) {
    return weights.map(() => Math.floor(total / weights.length));
  }

  const distributable = total - reservedMin;
  const safeWeights = weights.map((w) => Math.max(1, w));
  const weightTotal = safeWeights.reduce((sum, w) => sum + w, 0);

  const raw = safeWeights.map(
    (w) => min + (w / weightTotal) * distributable,
  );
  const base = raw.map((value) => Math.floor(value));
  let remainder = total - base.reduce((sum, value) => sum + value, 0);

  return base.map((value, index) => {
    if (remainder <= 0) return value;
    const fractional = raw[index] - Math.floor(raw[index]);
    const largerFractionCount = raw.filter(
      (candidate) => candidate - Math.floor(candidate) > fractional,
    ).length;
    if (largerFractionCount >= remainder) return value;
    remainder -= 1;
    return value + 1;
  });
}

/**
 * User dragged a slider on `tobaccoId`. Clamp the new value to the legal
 * range so other slots can each still hold at least MIN, then redistribute
 * the residual to the others proportionally to their current weights.
 */
function rebalanceFixedSlot(
  slots: MixSlot[],
  tobaccoId: string,
  percentage: number,
): MixSlot[] {
  if (slots.length <= 1) {
    return slots.map((slot) => ({ ...slot, percentage: 100 }));
  }

  const min = MIN_PERCENT_PER_SLOT;
  const otherSlots = slots.filter((slot) => slot.tobaccoId !== tobaccoId);
  const maxFixed = 100 - otherSlots.length * min;
  const fixed = Math.max(min, Math.min(maxFixed, Math.round(percentage)));
  const distributed = distribute(
    100 - fixed,
    otherSlots.map((slot) => slot.percentage),
  );
  let otherIndex = 0;

  return slots.map((slot) => {
    if (slot.tobaccoId === tobaccoId) return { ...slot, percentage: fixed };
    const nextPercentage = distributed[otherIndex] ?? min;
    otherIndex += 1;
    return { ...slot, percentage: nextPercentage };
  });
}

export const useMixStore = create<MixStore>()(
  persist(
    (set, get) => ({
      slots: [],
      tableId: null,
      addTobacco: (tobaccoId) =>
        set((state) => {
          if (state.slots.find((s) => s.tobaccoId === tobaccoId)) return state;
          if (state.slots.length >= MAX_INGREDIENTS_PER_MIX) return state;
          return {
            slots: redistribute([
              ...state.slots,
              { tobaccoId, percentage: 0 },
            ]),
          };
        }),
      removeTobacco: (tobaccoId) =>
        set((state) => ({
          slots: redistribute(
            state.slots.filter((s) => s.tobaccoId !== tobaccoId),
          ),
        })),
      setPercentage: (tobaccoId, pct) =>
        set((state) => ({
          slots: rebalanceFixedSlot(state.slots, tobaccoId, pct),
        })),
      setTableId: (tableId) => set({ tableId }),
      clear: () => set({ slots: [] }),
      hasTobacco: (tobaccoId) =>
        get().slots.some((s) => s.tobaccoId === tobaccoId),
    }),
    {
      name: "shelter.mix",
      storage: createJSONStorage(() => localStorage),
      // Only persist serializable state — methods are restored from the factory.
      partialize: (s) => ({ slots: s.slots, tableId: s.tableId }),
    },
  ),
);
