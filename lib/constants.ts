/** Hard upper bound — the editable setting `max_ingredients_per_mix` can be
 * any value between MIN_INGREDIENTS_LIMIT and MAX_INGREDIENTS_LIMIT. */
export const MAX_INGREDIENTS_LIMIT = 4;
export const MIN_INGREDIENTS_LIMIT = 3;
/** Compile-time fallback for code paths that can't reach app_settings (Zustand
 * store, validators). Admin can drop the per-mix cap to 3 via settings. */
export const MAX_INGREDIENTS_PER_MIX = MAX_INGREDIENTS_LIMIT;

/** Minimum share a single tobacco can occupy in a mix. */
export const MIN_PERCENT_PER_SLOT = 10;

/** Strength scale for a single tobacco flavor. Mixes can go higher via overpack. */
export const TOBACCO_MAX_STRENGTH = 10;
/** Strength scale shown for a finished mix. Overpack can push a 10/10 mix to 12/12. */
export const MIX_MAX_STRENGTH = 12;
/** Backwards-compatible alias for mix strength scale. */
export const MAX_STRENGTH = MIX_MAX_STRENGTH;

export const DEFAULT_PRICE_UAH = 350;
export const REFILL_PRICE_UAH = 200;
export const OVERPACK_PRICE_UAH = 50;
export const OVERPACK_EXTRA_GRAMS = 4;
/** Base portion of tobacco (grams) for reference in the overpack copy. */
export const DEFAULT_BOWL_GRAMS = 18;

export const SERVICE_TYPES = ["hookah", "refill", "day_loaner"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  hookah: "Кальян",
  refill: "Забивка",
  day_loaner: "Кальян з собою на день",
};

/** Refundable deposit for day_loaner orders. Stored as the compile-time
 * default; admin can override via app_settings.day_loaner_deposit. */
export const DAY_LOANER_DEPOSIT_UAH = 1000;
/** Non-refundable mix/service price for day_loaner orders. The refundable
 * deposit is tracked separately. */
export const DAY_LOANER_PRICE_UAH = DEFAULT_PRICE_UAH;

/** Service-tier base price (excluding mix). day_loaner uses the mix price
 * directly plus a refundable deposit; the kalyud itself is "free" (loaner). */
export const SERVICE_TYPE_PRICES: Record<ServiceType, number> = {
  hookah: DEFAULT_PRICE_UAH,
  refill: REFILL_PRICE_UAH,
  day_loaner: DAY_LOANER_DEPOSIT_UAH + DAY_LOANER_PRICE_UAH,
};

/** Холодок (cool/menthol) intensity scale used by the mixer add-on. */
export const COOL_MAX_INTENSITY = 3;
export const COOL_MIN_INTENSITY = 1;

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivered",
  "closed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Очікує",
  accepted: "Прийнято",
  preparing: "Готується",
  ready: "Готово",
  delivered: "Видано",
  closed: "Закрито",
  cancelled: "Скасовано",
};

/** Statuses that should still appear in the kalyanchik's active list. */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivered",
];

export const STAFF_ROLES = ["kalyanchik", "admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
