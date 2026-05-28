import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  guestId: z.string().trim().min(8).max(64),
});

// POST /api/tobaccos/[id]/like
// Toggles the like for the request's guest_id. One like per (tobacco, guest);
// posting again removes it. Returns the new liked state and total count.
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid tobacco id" }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "guestId is required" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: existing, error: readError } = await supabase
    .from("tobacco_likes")
    .select("tobacco_id")
    .eq("tobacco_id", id)
    .eq("guest_id", body.guestId)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let liked: boolean;
  if (existing) {
    const { error } = await supabase
      .from("tobacco_likes")
      .delete()
      .eq("tobacco_id", id)
      .eq("guest_id", body.guestId);
    if (error) {
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    liked = false;
  } else {
    const { error } = await supabase
      .from("tobacco_likes")
      .insert({ tobacco_id: id, guest_id: body.guestId });
    if (error) {
      // 23503 = FK violation (unknown tobacco). 23505 = race double-insert (already liked).
      if (error.code === "23503") {
        return NextResponse.json({ error: "Tobacco not found" }, { status: 404 });
      }
      if (error.code !== "23505") {
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }
    }
    liked = true;
  }

  const { data: tobacco } = await supabase
    .from("tobaccos")
    .select("likes_count")
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({ liked, count: tobacco?.likes_count ?? 0 });
}
