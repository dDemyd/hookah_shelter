import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MAX_INGREDIENTS_PER_MIX,
  SERVICE_TYPES,
  SERVICE_TYPE_PRICES,
} from "@/lib/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { generateShortCode } from "@/lib/utils/generate-short-code";

const ingredientSchema = z.object({
  tobaccoId: z.string().min(1),
  percentage: z.number().int().min(1).max(100),
});

const createOrderSchema = z
  .object({
    tableId: z.number().int().positive().nullable().optional(),
    guestId: z.string().trim().min(8).max(64).optional(),
    guestName: z.string().trim().max(80).optional().default(""),
    guestContact: z.string().trim().max(80).optional().default(""),
    notes: z.string().trim().max(500).optional().default(""),
    serviceType: z.enum(SERVICE_TYPES).optional().default("hookah"),
    presetMixId: z.string().uuid().optional(),
    ingredients: z.array(ingredientSchema).max(MAX_INGREDIENTS_PER_MIX).optional(),
  })
  .superRefine((value, ctx) => {
    const hasPreset = Boolean(value.presetMixId);
    const hasIngredients = Boolean(value.ingredients?.length);
    if (hasPreset === hasIngredients) {
      ctx.addIssue({
        code: "custom",
        message: "Передай або presetMixId, або ingredients.",
        path: ["ingredients"],
      });
    }
    if (value.ingredients?.length) {
      const ids = new Set(value.ingredients.map((item) => item.tobaccoId));
      const total = value.ingredients.reduce((sum, item) => sum + item.percentage, 0);
      if (ids.size !== value.ingredients.length) {
        ctx.addIssue({
          code: "custom",
          message: "Тютюн у міксі не може дублюватися.",
          path: ["ingredients"],
        });
      }
      if (total !== 100) {
        ctx.addIssue({
          code: "custom",
          message: "Сума відсотків має бути 100.",
          path: ["ingredients"],
        });
      }
    }
  });

type TobaccoSnapshotRow = {
  id: string;
  name: string;
  strength: number;
  in_stock: boolean;
  is_active: boolean;
  popularity: number;
  tobacco_brands: { name: string } | { name: string }[] | null;
  flavor_categories: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function snapshot(row: TobaccoSnapshotRow) {
  return {
    brand: firstRelation(row.tobacco_brands)?.name ?? "Без бренду",
    name: row.name,
    strength: row.strength,
    category: firstRelation(row.flavor_categories)?.name ?? null,
    category_slug: firstRelation(row.flavor_categories)?.slug ?? null,
  };
}

async function generateUniqueShortCode(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const shortCode = generateShortCode();
    const { data, error } = await supabase
      .from("orders")
      .select("id")
      .eq("short_code", shortCode)
      .maybeSingle();
    if (error) throw error;
    if (!data) return shortCode;
  }
  throw new Error("Не вдалося згенерувати унікальний код замовлення.");
}

export async function POST(request: Request) {
  const parsed = createOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некоректне замовлення", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const supabase = createSupabaseServiceClient();
  const shortCode = await generateUniqueShortCode(supabase);

  let ingredients = body.ingredients ?? [];
  if (body.presetMixId) {
    const { data, error } = await supabase
      .from("preset_mix_ingredients")
      .select("tobacco_id,percentage")
      .eq("preset_mix_id", body.presetMixId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    ingredients = data.map((item) => ({
      tobaccoId: item.tobacco_id,
      percentage: item.percentage,
    }));
    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: "У фірмового міксу немає складу." },
        { status: 400 },
      );
    }
  }

  const tobaccoIds = ingredients.map((item) => item.tobaccoId);
  const { data: tobaccos, error: tobaccoError } = await supabase
    .from("tobaccos")
    .select(
      "id,name,strength,in_stock,is_active,popularity,tobacco_brands(name),flavor_categories(name,slug)",
    )
    .in("id", tobaccoIds);

  if (tobaccoError) {
    return NextResponse.json({ error: tobaccoError.message }, { status: 500 });
  }

  const tobaccoById = new Map(
    (tobaccos as unknown as TobaccoSnapshotRow[]).map((row) => [row.id, row]),
  );
  const unavailable = ingredients.find((item) => {
    const tobacco = tobaccoById.get(item.tobaccoId);
    return !tobacco || !tobacco.is_active || !tobacco.in_stock;
  });
  if (unavailable) {
    return NextResponse.json(
      { error: "Один із тютюнів недоступний для замовлення." },
      { status: 400 },
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      short_code: shortCode,
      table_id: body.tableId ?? null,
      guest_id: body.guestId ?? null,
      guest_name: body.guestName || null,
      guest_contact: body.guestContact || null,
      notes: body.notes || null,
      preset_mix_id: body.presetMixId ?? null,
      service_type: body.serviceType,
      price: SERVICE_TYPE_PRICES[body.serviceType],
    })
    .select("id,short_code")
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const ingredientRows = ingredients.map((item) => {
    const tobacco = tobaccoById.get(item.tobaccoId)!;
    return {
      order_id: order.id,
      tobacco_id: item.tobaccoId,
      tobacco_snapshot: snapshot(tobacco),
      percentage: item.percentage,
    };
  });
  const { error: ingredientError } = await supabase
    .from("order_ingredients")
    .insert(ingredientRows);

  if (ingredientError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: ingredientError.message }, { status: 500 });
  }

  await Promise.all(
    tobaccoIds.map((id) => {
      const current = tobaccoById.get(id)?.popularity ?? 0;
      return supabase
        .from("tobaccos")
        .update({ popularity: current + 1 })
        .eq("id", id);
    }),
  );

  // Fire-and-forget Telegram notification. We await to keep the work inside
  // the request lifetime (serverless cuts off detached promises), but a TG
  // outage must not fail the order — guests have already committed.
  try {
    await notifyTelegram(request, order.id);
  } catch (err) {
    console.error("[orders] telegram notify failed:", err);
  }

  return NextResponse.json({
    id: order.id,
    shortCode: order.short_code,
  });
}

async function notifyTelegram(request: Request, orderId: string) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  await fetch(`${origin}/api/telegram/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
    cache: "no-store",
  });
}
