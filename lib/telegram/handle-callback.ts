// Telegram callback_query handler. Receives "accept:<id>" / "preparing:<id>" /
// "ready:<id>" / "delivered:<id>" / "cancel:<id>" from the inline keyboard,
// transitions the order, and edits the original message in place.

import "server-only";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  answerCallbackQuery,
  editTelegramMessageText,
  TelegramApiError,
} from "./send-message";
import {
  formatOrderMessage,
  keyboardForStatus,
  type FormatOrderIngredient,
} from "./format-order";
import { ALLOWED_TRANSITIONS } from "./status-transitions";

// Subset of the Telegram Update payload we care about.
type CallbackQuery = {
  id: string;
  from: { id: number; username?: string; first_name?: string };
  data?: string;
  message?: {
    message_id: number;
    chat: { id: number };
  };
};

export type TelegramUpdate = {
  update_id: number;
  callback_query?: CallbackQuery;
};

type CallbackAction =
  | "accept"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancel";

const ACTION_TO_STATUS: Record<CallbackAction, OrderStatus> = {
  accept: "accepted",
  preparing: "preparing",
  ready: "ready",
  delivered: "delivered",
  cancel: "cancelled",
};

function parseCallbackData(
  data: string | undefined,
): { action: CallbackAction; orderId: string } | null {
  if (!data) return null;
  const [action, orderId] = data.split(":");
  if (!orderId) return null;
  if (!(action in ACTION_TO_STATUS)) return null;
  return { action: action as CallbackAction, orderId };
}

type OrderIngredientRow = {
  percentage: number;
  tobacco_snapshot: {
    brand?: string;
    name?: string;
  };
};

type OrderRow = {
  id: string;
  short_code: string;
  table_id: number | null;
  guest_name: string | null;
  notes: string | null;
  status: OrderStatus;
  cancelled_reason: string | null;
  telegram_message_id: number | null;
  telegram_chat_id: string | null;
  preset_mixes: { name: string } | null;
  order_ingredients: OrderIngredientRow[];
};

export async function handleTelegramCallback(
  update: TelegramUpdate,
): Promise<void> {
  const cb = update.callback_query;
  if (!cb) return;

  const parsed = parseCallbackData(cb.data);
  if (!parsed) {
    await answerCallbackQuery({
      callbackQueryId: cb.id,
      text: "Невідома дія",
      showAlert: true,
    });
    return;
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,short_code,table_id,guest_name,notes,status,cancelled_reason,telegram_message_id,telegram_chat_id,preset_mixes(name),order_ingredients(percentage,tobacco_snapshot)",
    )
    .eq("id", parsed.orderId)
    .maybeSingle();

  if (error || !data) {
    await answerCallbackQuery({
      callbackQueryId: cb.id,
      text: "Замовлення не знайдено",
      showAlert: true,
    });
    return;
  }

  const order = data as unknown as OrderRow;
  const nextStatus = ACTION_TO_STATUS[parsed.action];

  if (!ALLOWED_TRANSITIONS[order.status].includes(nextStatus)) {
    await answerCallbackQuery({
      callbackQueryId: cb.id,
      text: `Не можна з "${order.status}" в "${nextStatus}"`,
      showAlert: true,
    });
    return;
  }

  const actorName =
    cb.from.username ? `@${cb.from.username}` : (cb.from.first_name ?? null);

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", order.id);

  if (updateError) {
    await answerCallbackQuery({
      callbackQueryId: cb.id,
      text: "Помилка БД",
      showAlert: true,
    });
    return;
  }

  // Acknowledge to Telegram so the spinner stops on the user's button
  await answerCallbackQuery({
    callbackQueryId: cb.id,
    text: nextStatus === "cancelled" ? "Скасовано" : "Готово",
  });

  // Edit the original notification to reflect the new state.
  // We can only edit if we stored the message_id when posting.
  if (order.telegram_message_id && order.telegram_chat_id) {
    const ingredients: FormatOrderIngredient[] = order.order_ingredients.map(
      (row) => ({
        brand: row.tobacco_snapshot.brand ?? "—",
        name: row.tobacco_snapshot.name ?? "—",
        percentage: row.percentage,
      }),
    );
    try {
      await editTelegramMessageText({
        chatId: order.telegram_chat_id,
        messageId: order.telegram_message_id,
        text: formatOrderMessage({
          shortCode: order.short_code,
          tableId: order.table_id,
          guestName: order.guest_name,
          notes: order.notes,
          status: nextStatus,
          presetName: order.preset_mixes?.name ?? null,
          ingredients,
          actorName,
          cancelledReason: order.cancelled_reason,
        }),
        replyMarkup: keyboardForStatus(nextStatus, order.id),
      });
    } catch (err) {
      if (err instanceof TelegramApiError) {
        // "message is not modified" is benign — happens if message already shows
        // this exact text. Anything else we re-throw so the webhook returns 500
        // and Telegram retries.
        if (!/not modified/i.test(err.description)) throw err;
      } else {
        throw err;
      }
    }
  }
}

// Re-export so the lib has a single public entry alongside the dispatcher.
export { ORDER_STATUSES };
