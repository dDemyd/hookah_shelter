// Shared by PATCH /api/orders/[id]/status and the Telegram callback handler.
// One source of truth so an unwanted transition is rejected the same way no
// matter which surface initiates it.

import type { OrderStatus } from "@/lib/constants";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivered", "cancelled"],
  // 'delivered' = the guest received the hookah and is smoking. The kalyanchik
  // closes the order when the guest leaves the table. Cancellation is still
  // possible (e.g. the guest complains and walks out without paying).
  delivered: ["closed", "cancelled"],
  closed: [],
  cancelled: [],
};

export function isAllowedTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
