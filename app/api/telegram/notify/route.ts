import { NextResponse } from "next/server";
import { z } from "zod";
import type { ServiceType } from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { formatOrderMessage, keyboardForStatus } from "@/lib/telegram/format-order";
import {
  sendTelegramMessage,
  TelegramApiError,
  TelegramConfigError,
} from "@/lib/telegram/send-message";

// Internal endpoint. Called by POST /api/orders after creating an order, and
// also exposed for manual retries from the admin (later). Body holds just the
// order id; we re-read everything from the DB so the caller can't spoof
// content.

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

type OrderRow = {
  id: string;
  short_code: string;
  table_id: number | null;
  guest_name: string | null;
  notes: string | null;
  status: "pending" | "accepted" | "preparing" | "ready" | "delivered" | "cancelled";
  service_type: ServiceType;
  price: number;
  telegram_message_id: number | null;
  preset_mixes: { name: string } | null;
  order_ingredients: {
    percentage: number;
    tobacco_snapshot: { brand?: string; name?: string };
  }[];
};

export async function POST(request: Request) {
  const chatId = process.env.TELEGRAM_NOTIFICATION_CHAT_ID;
  if (!chatId || chatId === "0") {
    return NextResponse.json(
      { error: "TELEGRAM_NOTIFICATION_CHAT_ID is not configured" },
      { status: 500 },
    );
  }

  const parsed = bodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from("orders")
    .select(
      "id,short_code,table_id,guest_name,notes,status,service_type,price,telegram_message_id,preset_mixes(name),order_ingredients(percentage,tobacco_snapshot)",
    )
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const order = data as unknown as OrderRow;

  if (order.telegram_message_id !== null) {
    return NextResponse.json(
      { ok: true, alreadySent: true, messageId: order.telegram_message_id },
    );
  }

  try {
    const sent = await sendTelegramMessage({
      chatId,
      text: formatOrderMessage({
        shortCode: order.short_code,
        tableId: order.table_id,
        guestName: order.guest_name,
        notes: order.notes,
        status: order.status,
        serviceType: order.service_type,
        price: order.price,
        presetName: order.preset_mixes?.name ?? null,
        ingredients: order.order_ingredients.map((row) => ({
          brand: row.tobacco_snapshot.brand ?? "—",
          name: row.tobacco_snapshot.name ?? "—",
          percentage: row.percentage,
        })),
      }),
      replyMarkup: keyboardForStatus(order.status, order.id),
    });

    await service
      .from("orders")
      .update({
        telegram_message_id: sent.messageId,
        telegram_chat_id: String(sent.chatId),
      })
      .eq("id", order.id);

    return NextResponse.json({ ok: true, messageId: sent.messageId });
  } catch (err) {
    if (err instanceof TelegramConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof TelegramApiError) {
      return NextResponse.json(
        { error: err.description, code: err.errorCode },
        { status: 502 },
      );
    }
    throw err;
  }
}
