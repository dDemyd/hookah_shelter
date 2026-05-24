// Telegram HTML formatting for Сховище order notifications.
// HTML parse_mode lets us bold/escape; safer than MarkdownV2.

import "server-only";
import {
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  type OrderStatus,
  type ServiceType,
} from "@/lib/constants";
import type { InlineKeyboardMarkup } from "./send-message";

export type FormatOrderIngredient = {
  brand: string;
  name: string;
  percentage: number;
};

export type FormatOrderInput = {
  shortCode: string;
  tableId: number | null;
  guestName: string | null;
  notes: string | null;
  status: OrderStatus;
  serviceType?: ServiceType;
  price?: number;
  presetName?: string | null;
  ingredients: FormatOrderIngredient[];
  /** Telegram username/name of the staff member who acted, when known. */
  actorName?: string | null;
  cancelledReason?: string | null;
};

// HTML escape — Telegram is strict and untrusted user fields go through here.
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const STATUS_EMOJI: Record<OrderStatus, string> = {
  pending: "🆕",
  accepted: "✅",
  preparing: "🔥",
  ready: "🎯",
  delivered: "📦",
  cancelled: "❌",
};

/**
 * Build the HTML body of an order notification.
 * Always includes the short code, table, mix composition and status.
 * Adds presetName / notes / actor / cancelled reason when present.
 */
export function formatOrderMessage(input: FormatOrderInput): string {
  const lines: string[] = [];
  const emoji = STATUS_EMOJI[input.status];
  const statusLabel = ORDER_STATUS_LABELS[input.status];

  // Header
  if (input.status === "pending") {
    lines.push(
      `${emoji} <b>Нове замовлення</b> <code>${esc(input.shortCode)}</code>`,
    );
  } else {
    lines.push(
      `${emoji} <b>${esc(statusLabel)}</b> · <code>${esc(input.shortCode)}</code>`,
    );
  }

  // Table + service type
  const headerBits: string[] = [];
  headerBits.push(
    input.tableId !== null
      ? `📍 Стіл №${input.tableId}`
      : "📦 На винос",
  );
  if (input.serviceType) {
    const serviceLabel = SERVICE_TYPE_LABELS[input.serviceType];
    const serviceIcon = input.serviceType === "refill" ? "🍃" : "🪔";
    const priceTag =
      typeof input.price === "number" ? ` · ${input.price}₴` : "";
    headerBits.push(`${serviceIcon} ${serviceLabel}${priceTag}`);
  }
  lines.push(headerBits.join("  ·  "));

  // Composition
  if (input.presetName) {
    lines.push(`🍵 <b>${esc(input.presetName)}</b> (фірмовий)`);
  }
  if (input.ingredients.length > 0) {
    const items = input.ingredients
      .map(
        (i) =>
          `• ${esc(i.brand)} ${esc(i.name)} <b>${i.percentage}%</b>`,
      )
      .join("\n");
    lines.push(`<b>Склад:</b>\n${items}`);
  }

  // Guest details
  if (input.guestName) {
    lines.push(`👤 ${esc(input.guestName)}`);
  }
  if (input.notes) {
    lines.push(`💬 ${esc(input.notes)}`);
  }

  // Actor and cancellation reason (footer)
  if (input.actorName && input.status !== "pending") {
    lines.push(`<i>— ${esc(input.actorName)}</i>`);
  }
  if (input.status === "cancelled" && input.cancelledReason) {
    lines.push(`<i>Причина: ${esc(input.cancelledReason)}</i>`);
  }

  return lines.join("\n\n");
}

/**
 * Inline keyboard for a pending order. Buttons disappear once accepted/cancelled
 * (the webhook handler edits the message with `keyboardForStatus(newStatus)` →
 * undefined for terminal states).
 */
export function keyboardForStatus(
  status: OrderStatus,
  orderId: string,
): InlineKeyboardMarkup | undefined {
  if (status === "pending") {
    return {
      inline_keyboard: [
        [
          { text: "✅ Прийняти", callback_data: `accept:${orderId}` },
          { text: "❌ Відхилити", callback_data: `cancel:${orderId}` },
        ],
      ],
    };
  }
  if (status === "accepted") {
    return {
      inline_keyboard: [
        [{ text: "🔥 Готую", callback_data: `preparing:${orderId}` }],
        [{ text: "❌ Скасувати", callback_data: `cancel:${orderId}` }],
      ],
    };
  }
  if (status === "preparing") {
    return {
      inline_keyboard: [
        [{ text: "🎯 Готовий", callback_data: `ready:${orderId}` }],
      ],
    };
  }
  if (status === "ready") {
    return {
      inline_keyboard: [
        [{ text: "📦 Віддано", callback_data: `delivered:${orderId}` }],
      ],
    };
  }
  // delivered / cancelled — terminal, no buttons
  return undefined;
}
