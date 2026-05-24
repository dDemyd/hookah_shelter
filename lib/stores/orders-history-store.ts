// Per-device history of orders this guest has submitted from this browser.
// Stored as a short list so the /orders tab can pull fresh status for each
// from Supabase without the guest having to log in. The server source of
// truth is `orders` in Postgres — this store is just an index of short_codes.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const HISTORY_LIMIT = 20;

export type SubmittedOrder = {
  shortCode: string;
  submittedAt: number;
};

type OrdersHistoryStore = {
  orders: SubmittedOrder[];
  add: (shortCode: string) => void;
  remove: (shortCode: string) => void;
  clear: () => void;
};

export const useOrdersHistoryStore = create<OrdersHistoryStore>()(
  persist(
    (set) => ({
      orders: [],
      add: (shortCode) =>
        set((state) => {
          // De-dupe, then put newest first, then trim.
          const filtered = state.orders.filter(
            (o) => o.shortCode !== shortCode,
          );
          return {
            orders: [
              { shortCode, submittedAt: Date.now() },
              ...filtered,
            ].slice(0, HISTORY_LIMIT),
          };
        }),
      remove: (shortCode) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.shortCode !== shortCode),
        })),
      clear: () => set({ orders: [] }),
    }),
    {
      name: "shelter.orders-history",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ orders: s.orders }),
    },
  ),
);
