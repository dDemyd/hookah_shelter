import { NextResponse } from "next/server";
import {
  COOL_CHANCE_DEFAULT,
  DAY_LOANER_DEPOSIT_UAH,
  DAY_LOANER_PRICE_UAH,
  DEFAULT_PRICE_UAH,
  JACKPOT_CHANCE_DEFAULT,
  MAX_INGREDIENTS_LIMIT,
  MAX_INGREDIENTS_PER_MIX,
  MIN_INGREDIENTS_LIMIT,
  OVERPACK_CHANCE_DEFAULT,
  OVERPACK_PRICE_UAH,
  REFILL_PRICE_UAH,
} from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

// RLS hides app_settings from anon users, so the guest UI can't read the
// settings table directly. This endpoint exposes only the small set of values
// that are safe to surface publicly (no telegram chat IDs, etc).
export async function GET() {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key,value")
    .in("key", [
      "max_ingredients_per_mix",
      "accepting_orders",
      "default_price",
      "refill_price",
      "day_loaner_price",
      "day_loaner_deposit",
      "overpack_price",
      "jackpot_chance_percent",
      "overpack_chance_percent",
      "cool_chance_percent",
    ]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const map = new Map((data ?? []).map((row) => [row.key, row.value]));

  const rawMax = map.get("max_ingredients_per_mix");
  const maxRaw = typeof rawMax === "number" ? rawMax : Number(rawMax);
  const maxIngredients = Number.isFinite(maxRaw)
    ? Math.min(MAX_INGREDIENTS_LIMIT, Math.max(MIN_INGREDIENTS_LIMIT, maxRaw))
    : MAX_INGREDIENTS_PER_MIX;
  const settingNumber = (key: string, fallback: number): number => {
    const raw = map.get(key);
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const chanceFromPercent = (raw: unknown, fallback: number): number => {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(1, Math.max(0, n / 100));
  };

  return NextResponse.json(
    {
      maxIngredientsPerMix: maxIngredients,
      acceptingOrders: map.get("accepting_orders") !== false,
      defaultPrice: settingNumber("default_price", DEFAULT_PRICE_UAH),
      refillPrice: settingNumber("refill_price", REFILL_PRICE_UAH),
      dayLoanerPrice: settingNumber("day_loaner_price", DAY_LOANER_PRICE_UAH),
      dayLoanerDeposit: settingNumber(
        "day_loaner_deposit",
        DAY_LOANER_DEPOSIT_UAH,
      ),
      overpackPrice: settingNumber("overpack_price", OVERPACK_PRICE_UAH),
      // Chances stored as integer percent (0..100). Clamp + convert to 0..1.
      jackpotChance: chanceFromPercent(
        map.get("jackpot_chance_percent"),
        JACKPOT_CHANCE_DEFAULT,
      ),
      overpackChance: chanceFromPercent(
        map.get("overpack_chance_percent"),
        OVERPACK_CHANCE_DEFAULT,
      ),
      coolChance: chanceFromPercent(
        map.get("cool_chance_percent"),
        COOL_CHANCE_DEFAULT,
      ),
    },
    {
      headers: {
        // 30 s edge cache; admin changes propagate quickly without hammering DB.
        "Cache-Control": "public, max-age=10, s-maxage=30",
      },
    },
  );
}
