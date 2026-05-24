// Server-only wrappers around Telegram Bot API.
// Never import from a Client Component — the bot token must stay on the server.

import "server-only";

const BASE = "https://api.telegram.org";

function botToken(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t || t === "placeholder-token") {
    throw new TelegramConfigError("TELEGRAM_BOT_TOKEN is not configured");
  }
  return t;
}

export class TelegramConfigError extends Error {}
export class TelegramApiError extends Error {
  constructor(
    public readonly method: string,
    public readonly statusCode: number,
    public readonly description: string,
    public readonly errorCode?: number,
  ) {
    super(`Telegram ${method} failed (${statusCode}): ${description}`);
  }
}

type TelegramResponse<T> =
  | { ok: true; result: T }
  | { ok: false; description: string; error_code?: number };

async function call<T>(
  method: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${BASE}/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Telegram API responses are not cached
    cache: "no-store",
  });

  const data = (await res.json()) as TelegramResponse<T>;
  if (!data.ok) {
    throw new TelegramApiError(
      method,
      res.status,
      data.description ?? "Unknown error",
      data.error_code,
    );
  }
  return data.result;
}

// ---------- Inline keyboard primitives ----------

export type InlineKeyboardButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

// ---------- API surface ----------

type MessageResult = {
  message_id: number;
  chat: { id: number };
};

export async function sendTelegramMessage(opts: {
  chatId: string | number;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyMarkup?: InlineKeyboardMarkup;
  disableWebPagePreview?: boolean;
}): Promise<{ messageId: number; chatId: number }> {
  const result = await call<MessageResult>("sendMessage", {
    chat_id: opts.chatId,
    text: opts.text,
    parse_mode: opts.parseMode ?? "HTML",
    reply_markup: opts.replyMarkup,
    disable_web_page_preview: opts.disableWebPagePreview ?? true,
  });
  return { messageId: result.message_id, chatId: result.chat.id };
}

export async function editTelegramMessageText(opts: {
  chatId: string | number;
  messageId: number;
  text: string;
  parseMode?: "HTML" | "Markdown";
  replyMarkup?: InlineKeyboardMarkup;
}): Promise<void> {
  await call<MessageResult | boolean>("editMessageText", {
    chat_id: opts.chatId,
    message_id: opts.messageId,
    text: opts.text,
    parse_mode: opts.parseMode ?? "HTML",
    reply_markup: opts.replyMarkup,
    disable_web_page_preview: true,
  });
}

export async function answerCallbackQuery(opts: {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}): Promise<void> {
  await call<boolean>("answerCallbackQuery", {
    callback_query_id: opts.callbackQueryId,
    text: opts.text,
    show_alert: opts.showAlert ?? false,
  });
}

export async function setWebhook(opts: {
  url: string;
  secretToken: string;
  allowedUpdates?: string[];
}): Promise<void> {
  await call<boolean>("setWebhook", {
    url: opts.url,
    secret_token: opts.secretToken,
    allowed_updates: opts.allowedUpdates ?? ["message", "callback_query"],
    drop_pending_updates: false,
  });
}

export async function deleteWebhook(): Promise<void> {
  await call<boolean>("deleteWebhook", { drop_pending_updates: false });
}
