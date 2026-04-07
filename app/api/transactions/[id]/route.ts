import { NextRequest, NextResponse } from "next/server";
import { updateTransactionCategory } from "@/lib/queries";
import { CATEGORIES } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { category } = body;
  if (!category || !(CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    await updateTransactionCategory(id, category);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
