import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  guestId: z.string().trim().min(8).max(64),
  stars: z.number().int().min(1).max(5),
});

// POST /api/presets/[id]/rate
// Upserts the request guest's 1–5 star rating for an authored preset mix.
// One rating per (preset_mix, guest); posting again overwrites it. Returns the
// guest's stars plus the new average and count (kept in sync by a DB trigger).
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid preset id" }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "guestId and stars (1–5) are required" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServiceClient();

  const { error } = await supabase.from("mix_ratings").upsert(
    {
      preset_mix_id: id,
      guest_id: body.guestId,
      stars: body.stars,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "preset_mix_id,guest_id" },
  );

  if (error) {
    // 23503 = FK violation (unknown preset mix).
    if (error.code === "23503") {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const { data: preset } = await supabase
    .from("preset_mixes")
    .select("rating_avg,rating_count")
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({
    stars: body.stars,
    avg: preset?.rating_avg ?? 0,
    count: preset?.rating_count ?? 0,
  });
}
