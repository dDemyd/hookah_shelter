import { NextResponse } from "next/server";
import {
  handleTelegramCallback,
  type TelegramUpdate,
} from "@/lib/telegram/handle-callback";

// POST /api/telegram/webhook
// Telegram POSTs every update here. We verify the secret header before doing
// anything else. Updates we don't care about (plain messages, edits, etc.) are
// acknowledged with a 200 so Telegram doesn't retry.
export async function POST(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || expected === "placeholder-webhook-secret") {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 500 },
    );
  }

  const provided = request.headers.get("x-telegram-bot-api-secret-token");
  if (provided !== expected) {
    // 401 + an opaque message — don't leak whether the header was missing vs wrong.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await handleTelegramCallback(update);
  } catch (err) {
    console.error("[telegram/webhook] handler error:", err);
    // Returning 500 makes Telegram retry the update. That's what we want for
    // transient failures (Supabase blip, network); for permanent failures the
    // log is the alert.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
