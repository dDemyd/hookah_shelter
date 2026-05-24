import { NextResponse } from "next/server";

// GET /api/stats/popular — top mixes / tobaccos by period.
// Implemented in Stage 7 (admin stats).
export async function GET() {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 },
  );
}
