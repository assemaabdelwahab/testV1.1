import { NextRequest, NextResponse } from "next/server";
import { upsertCorrectionAndBackfill } from "@/lib/queries";
import { CATEGORIES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  let body: { merchant_pattern?: string; correct_category?: string; match_type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { merchant_pattern, correct_category, match_type = "exact" } = body;

  if (!merchant_pattern?.trim()) {
    return NextResponse.json({ error: "merchant_pattern required" }, { status: 400 });
  }
  if (!correct_category || !(CATEGORIES as readonly string[]).includes(correct_category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (match_type !== "exact" && match_type !== "contains") {
    return NextResponse.json({ error: "match_type must be exact or contains" }, { status: 400 });
  }

  try {
    await upsertCorrectionAndBackfill(
      merchant_pattern.trim(),
      correct_category,
      match_type as "exact" | "contains"
    );
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
