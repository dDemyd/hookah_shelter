// Telegram callback_query handler. Receives "accept:<id>" / "preparing:<id>" /
// "ready:<id>" / "delivered:<id>" / "closed:<id>" / "cancel:<id>" from the
// inline keyboard, transitions the order, and edits the original message.

import "server-only";
import { ORDER_STATUSES, type OrderStatus, type ServiceType } from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  answerCallbackQuery,
  editTelegramMessageText,
  sendTelegramMessage,
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

type TelegramMessage = {
  message_id: number;
  from?: { id: number; username?: string; first_name?: string };
  chat: { id: number; type?: string };
  text?: string;
};

export type TelegramUpdate = {
  update_id: number;
  callback_query?: CallbackQuery;
  message?: TelegramMessage;
};

type CallbackAction =
  | "accept"
  | "preparing"
  | "ready"
  | "delivered"
  | "closed"
  | "cancel";

const ACTION_TO_STATUS: Record<CallbackAction, OrderStatus> = {
  accept: "accepted",
  preparing: "preparing",
  ready: "ready",
  delivered: "delivered",
  closed: "closed",
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
  guest_contact: string | null;
  notes: string | null;
  status: OrderStatus;
  service_type: ServiceType;
  price: number;
  is_overpack: boolean;
  cool_intensity: number;
  deposit_amount: number;
  cancelled_reason: string | null;
  accepted_by: string | null;
  telegram_message_id: number | null;
  telegram_chat_id: string | null;
  preset_mixes: { name: string } | null;
  order_ingredients: OrderIngredientRow[];
};

type StaffProfileRow = {
  id: string;
  full_name: string;
  is_active: boolean;
  user_telegram_id: number | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function extractLinkEmail(text: string | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed || trimmed === "/start") return null;

  const value = trimmed.toLowerCase().startsWith("/link")
    ? trimmed.slice("/link".length).trim()
    : trimmed;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value.toLowerCase();
}

async function findAuthUserIdByEmail(
  email: string,
  supabase: ReturnType<typeof createSupabaseServiceClient>,
): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;

  const user = data.users.find(
    (candidate) => candidate.email?.toLowerCase() === email,
  );
  return user?.id ?? null;
}

async function handleTelegramMessage(message: TelegramMessage): Promise<void> {
  if (!message.from) return;

  if (message.chat.type && message.chat.type !== "private") {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Для привʼязки напиши мені в особисті повідомлення.",
    });
    return;
  }

  const email = extractLinkEmail(message.text);
  if (!email) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Надішли email адмінки або команду <code>/link email@example.com</code>.",
    });
    return;
  }

  const supabase = createSupabaseServiceClient();
  const userId = await findAuthUserIdByEmail(email, supabase);
  if (!userId) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Email не знайдено в адмінці.",
    });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("staff_profiles")
    .select("id,full_name,is_active,user_telegram_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Профіль співробітника для цього email не знайдено.",
    });
    return;
  }
  const staffProfile = profile as StaffProfileRow;
  if (!staffProfile.is_active) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Профіль співробітника вимкнений. Звернись до адміна.",
    });
    return;
  }

  const { data: existingLink, error: existingLinkError } = await supabase
    .from("staff_profiles")
    .select("id,full_name")
    .eq("user_telegram_id", message.from.id)
    .neq("id", staffProfile.id)
    .maybeSingle();

  if (existingLinkError) throw existingLinkError;
  if (existingLink) {
    await sendTelegramMessage({
      chatId: message.chat.id,
      text: "Цей Telegram вже привʼязаний до іншого співробітника.",
    });
    return;
  }

  const { error: updateError } = await supabase
    .from("staff_profiles")
    .update({ user_telegram_id: message.from.id })
    .eq("id", staffProfile.id);

  if (updateError) {
    if (updateError.code === "23505") {
      await sendTelegramMessage({
        chatId: message.chat.id,
        text: "Цей Telegram вже привʼязаний до іншого співробітника.",
      });
      return;
    }
    throw updateError;
  }

  await sendTelegramMessage({
    chatId: message.chat.id,
    text: `✅ Привʼязано: <b>${escapeHtml(staffProfile.full_name)}</b>`,
  });
}

export async function handleTelegramCallback(
  update: TelegramUpdate,
): Promise<void> {
  if (update.message) {
    await handleTelegramMessage(update.message);
    return;
  }

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
  const { data: actorProfile, error: actorProfileError } = await supabase
    .from("staff_profiles")
    .select("id,full_name,is_active,user_telegram_id")
    .eq("user_telegram_id", cb.from.id)
    .eq("is_active", true)
    .maybeSingle();
  if (actorProfileError) throw actorProfileError;

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,short_code,table_id,guest_name,guest_contact,notes,status,service_type,price,is_overpack,cool_intensity,deposit_amount,cancelled_reason,accepted_by,telegram_message_id,telegram_chat_id,preset_mixes(name),order_ingredients(percentage,tobacco_snapshot)",
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
    actorProfile?.full_name ??
    (cb.from.username ? `@${cb.from.username}` : (cb.from.first_name ?? null));

  const updates: { status: OrderStatus; accepted_by?: string } = {
    status: nextStatus,
  };
  if (nextStatus === "accepted" && !order.accepted_by && actorProfile?.id) {
    updates.accepted_by = actorProfile.id;
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update(updates)
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
          guestContact: order.guest_contact,
          notes: order.notes,
          status: nextStatus,
          serviceType: order.service_type,
          price: order.price,
          isOverpack: order.is_overpack,
          coolIntensity: order.cool_intensity,
          depositAmount: order.deposit_amount,
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
