export const MAX_INGREDIENTS_PER_MIX = 4;
/** Minimum share a single tobacco can occupy in a mix. */
export const MIN_PERCENT_PER_SLOT = 10;
export const DEFAULT_PRICE_UAH = 350;
export const REFILL_PRICE_UAH = 200;

export const SERVICE_TYPES = ["hookah", "refill"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  hookah: "Кальян",
  refill: "Забивка",
};

export const SERVICE_TYPE_PRICES: Record<ServiceType, number> = {
  hookah: DEFAULT_PRICE_UAH,
  refill: REFILL_PRICE_UAH,
};

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Очікує",
  accepted: "Прийнято",
  preparing: "Готується",
  ready: "Готово",
  delivered: "Віддано",
  cancelled: "Скасовано",
};

export const STAFF_ROLES = ["kalyanchik", "admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];
