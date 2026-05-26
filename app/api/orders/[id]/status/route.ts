import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ORDER_STATUSES,
  type OrderStatus,
  type ServiceType,
} from "@/lib/constants";
import type { Database } from "@/lib/supabase/types";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import {
  formatOrderMessage,
  keyboardForStatus,
  type FormatOrderIngredient,
} from "@/lib/telegram/format-order";
import {
  editTelegramMessageText,
  TelegramApiError,
  TelegramConfigError,
} from "@/lib/telegram/send-message";
import { ALLOWED_TRANSITIONS } from "@/lib/telegram/status-transitions";

const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
  cancelledReason: z.string().trim().max(200).optional(),
});

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
  order_ingredients: {
    percentage: number;
    tobacco_snapshot: { brand?: string; name?: string };
  }[];
};

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  // ── Auth: must be a signed-in staff member ──────────────────
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("id,full_name,role,is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
  }

  // ── Body validation ─────────────────────────────────────────
  const parsed = bodySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректний запит", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { status: nextStatus, cancelledReason } = parsed.data;

  if (nextStatus === "cancelled" && !cancelledReason) {
    return NextResponse.json(
      { error: "Вкажіть причину скасування." },
      { status: 400 },
    );
  }

  // ── Fetch current order ─────────────────────────────────────
  // Use the service client for the cross-table read+update so RLS doesn't
  // double-apply on top of the already-authenticated user.
  const service = createSupabaseServiceClient();
  const { data: orderRaw, error: orderError } = await service
    .from("orders")
    .select(
      "id,short_code,table_id,guest_name,guest_contact,notes,status,service_type,price,is_overpack,cool_intensity,deposit_amount,cancelled_reason,accepted_by,telegram_message_id,telegram_chat_id,preset_mixes(name),order_ingredients(percentage,tobacco_snapshot)",
    )
    .eq("id", id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }
  if (!orderRaw) {
    return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
  }
  const order = orderRaw as unknown as OrderRow;

  // ── Transition validation ───────────────────────────────────
  if (order.status === nextStatus) {
    return NextResponse.json({ ok: true, status: nextStatus });
  }
  if (!ALLOWED_TRANSITIONS[order.status].includes(nextStatus)) {
    return NextResponse.json(
      {
        error: `Перехід ${order.status} → ${nextStatus} заборонений.`,
      },
      { status: 409 },
    );
  }

  // ── Apply update ────────────────────────────────────────────
  const updates: Database["public"]["Tables"]["orders"]["Update"] = {
    status: nextStatus,
  };
  if (nextStatus === "accepted" && !order.accepted_by) {
    updates.accepted_by = user.id;
  }
  if (nextStatus === "cancelled") {
    updates.cancelled_reason = cancelledReason ?? null;
  }

  const { error: updateError } = await service
    .from("orders")
    .update(updates)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // ── Best-effort Telegram message edit ───────────────────────
  // Don't fail the request if Telegram is unhappy — DB is already updated.
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
          actorName: profile.full_name,
          cancelledReason: cancelledReason ?? order.cancelled_reason,
        }),
        replyMarkup: keyboardForStatus(nextStatus, order.id),
      });
    } catch (err) {
      if (err instanceof TelegramApiError) {
        if (!/not modified/i.test(err.description)) {
          console.error("[orders/status] telegram edit failed:", err);
        }
      } else if (!(err instanceof TelegramConfigError)) {
        console.error("[orders/status] telegram edit error:", err);
      }
    }
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
