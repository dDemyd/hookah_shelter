import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  sendTelegramMessage,
  TelegramApiError,
  TelegramConfigError,
} from "@/lib/telegram/send-message";

export const dynamic = "force-dynamic";

type SettingRow = {
  value: number | string | boolean | null;
};

type ReminderOrder = {
  id: string;
  short_code: string;
  table_id: number;
  status_changed_at: string;
  last_coal_reminder_at: string | null;
  telegram_chat_id: string;
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function intervalFromSetting(row: SettingRow | null): number {
  const raw = row?.value;
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number.NaN;

  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function isDue(order: ReminderOrder, now: number, intervalMinutes: number) {
  const basis = order.last_coal_reminder_at ?? order.status_changed_at;
  const elapsedMs = now - new Date(basis).getTime();
  return elapsedMs >= intervalMinutes * 60_000;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createSupabaseServiceClient();
  const { data: setting, error: settingError } = await service
    .from("app_settings")
    .select("value")
    .eq("key", "coal_reminder_interval_minutes")
    .maybeSingle();

  if (settingError) {
    return NextResponse.json({ error: settingError.message }, { status: 500 });
  }

  const intervalMinutes = intervalFromSetting(setting as SettingRow | null);
  if (intervalMinutes <= 0) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      checked: 0,
      due: 0,
      sent: 0,
      failed: 0,
    });
  }

  const { data: orders, error: ordersError } = await service
    .from("orders")
    .select(
      "id,short_code,table_id,status_changed_at,last_coal_reminder_at,telegram_chat_id",
    )
    .eq("status", "delivered")
    .eq("service_type", "hookah")
    .not("table_id", "is", null)
    .not("telegram_chat_id", "is", null);

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const now = Date.now();
  const due = ((orders ?? []) as unknown as ReminderOrder[]).filter((order) =>
    isDue(order, now, intervalMinutes),
  );
  const failures: { orderId: string; error: string }[] = [];
  let sent = 0;

  for (const order of due) {
    try {
      await sendTelegramMessage({
        chatId: order.telegram_chat_id,
        text: [
          `🔥 <b>Час струсити вугілля</b> · <code>${order.short_code}</code>`,
          `📍 Стіл №${order.table_id}`,
        ].join("\n"),
      });

      const { error: updateError } = await service
        .from("orders")
        .update({ last_coal_reminder_at: new Date(now).toISOString() })
        .eq("id", order.id)
        .eq("status", "delivered");

      if (updateError) throw updateError;
      sent += 1;
    } catch (err) {
      const message =
        err instanceof TelegramConfigError || err instanceof TelegramApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unknown error";
      failures.push({ orderId: order.id, error: message });
    }
  }

  return NextResponse.json(
    {
      ok: failures.length === 0,
      checked: orders?.length ?? 0,
      due: due.length,
      sent,
      failed: failures.length,
      failures,
    },
    { status: failures.length > 0 ? 207 : 200 },
  );
}
