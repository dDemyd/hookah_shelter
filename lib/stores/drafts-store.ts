// Per-device list of saved mix drafts. Each draft holds enough info to fully
// reconstruct the mix in the constructor without a network call. Persisted to
// localStorage; survives navigation and reloads but is NOT synced across
// devices (anonymous-guest assumption from the spec).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getGuestId } from "@/lib/utils/guest-id";

export type DraftSlot = {
  tobaccoId: string;
  percentage: number;
};

export type Draft = {
  id: string;
  name: string;
  slots: DraftSlot[];
  createdAt: number;
  /** Same browser-scoped UUID we tag orders with. */
  guestId: string | null;
};

type DraftsStore = {
  drafts: Draft[];
  add: (slots: DraftSlot[], name?: string) => Draft;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  clear: () => void;
};

function defaultDraftName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Мікс ${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newDraftId(): string {
  return `draft-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export const useDraftsStore = create<DraftsStore>()(
  persist(
    (set) => ({
      drafts: [],
      add: (slots, name) => {
        const draft: Draft = {
          id: newDraftId(),
          name: name?.trim() || defaultDraftName(),
          slots: slots.map((s) => ({ ...s })),
          createdAt: Date.now(),
          guestId: getGuestId(),
        };
        set((state) => ({ drafts: [draft, ...state.drafts] }));
        return draft;
      },
      remove: (id) =>
        set((state) => ({ drafts: state.drafts.filter((d) => d.id !== id) })),
      rename: (id, name) =>
        set((state) => ({
          drafts: state.drafts.map((d) =>
            d.id === id ? { ...d, name: name.trim() || d.name } : d,
          ),
        })),
      clear: () => set({ drafts: [] }),
    }),
    {
      name: "shelter.drafts",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ drafts: s.drafts }),
    },
  ),
);
