import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  guestId: z.string().trim().min(8).max(64),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().default(""),
});

// Reviews can only be left once the order has been handed over.
const REVIEWABLE_STATUSES = ["delivered", "closed"];

// POST /api/orders/[id]/review
// The guest who placed the order (matched by guest_id) can leave one rating +
// optional comment after it reaches delivered/closed. order_id is the PK, so a
// re-submit overwrites the previous review.
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "guestId and rating (1–5) are required" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,guest_id,status")
    .eq("id", id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.guest_id || order.guest_id !== body.guestId) {
    return NextResponse.json({ error: "Not your order" }, { status: 403 });
  }
  if (!REVIEWABLE_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { error: "Order is not yet delivered" },
      { status: 409 },
    );
  }

  const { data: review, error } = await supabase
    .from("order_reviews")
    .upsert(
      {
        order_id: id,
        guest_id: body.guestId,
        rating: body.rating,
        comment: body.comment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "order_id" },
    )
    .select("rating,comment")
    .single();

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ rating: review.rating, comment: review.comment });
}
