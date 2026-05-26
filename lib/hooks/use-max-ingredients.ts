"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DAY_LOANER_DEPOSIT_UAH,
  DAY_LOANER_PRICE_UAH,
  DEFAULT_PRICE_UAH,
  MAX_INGREDIENTS_PER_MIX,
  OVERPACK_PRICE_UAH,
  REFILL_PRICE_UAH,
} from "@/lib/constants";

type PublicSettings = {
  maxIngredientsPerMix: number;
  acceptingOrders: boolean;
  defaultPrice: number;
  refillPrice: number;
  dayLoanerPrice: number;
  dayLoanerDeposit: number;
  overpackPrice: number;
};

const FALLBACK_PUBLIC_SETTINGS: PublicSettings = {
  maxIngredientsPerMix: MAX_INGREDIENTS_PER_MIX,
  acceptingOrders: true,
  defaultPrice: DEFAULT_PRICE_UAH,
  refillPrice: REFILL_PRICE_UAH,
  dayLoanerPrice: DAY_LOANER_PRICE_UAH,
  dayLoanerDeposit: DAY_LOANER_DEPOSIT_UAH,
  overpackPrice: OVERPACK_PRICE_UAH,
};

/** Reads `app_settings.max_ingredients_per_mix` (via the public settings API,
 * since RLS hides the table from anon users) so guest UI honors what admin
 * configured. Falls back to the compile-time constant if the request fails. */
export function usePublicSettings(): PublicSettings {
  const { data } = useQuery({
    queryKey: ["public-settings"],
    queryFn: async (): Promise<PublicSettings> => {
      const response = await fetch("/api/settings/public");
      if (!response.ok) throw new Error("Не вдалося прочитати налаштування");
      return (await response.json()) as PublicSettings;
    },
    staleTime: 30_000,
  });
  return data ?? FALLBACK_PUBLIC_SETTINGS;
}

export function useMaxIngredientsPerMix(): number {
  return usePublicSettings().maxIngredientsPerMix;
}
