import { NextRequest, NextResponse } from "next/server";
import { insertTransaction } from "@/lib/queries";

export async function POST(request: NextRequest) {
  // API key auth — Make.com sends this in Authorization header
  const apiKey = process.env.TRANSACTIONS_API_KEY?.trim();
  if (apiKey) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { category, merchant_name, amount, transaction_date } = body;

    if (!category || amount == null || !transaction_date) {
      return NextResponse.json(
        { error: "Missing required fields: category, amount, transaction_date" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(transaction_date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const result = await insertTransaction({
      category,
      merchant_name: merchant_name || null,
      amount: parsedAmount,
      transaction_date,
    });

    if (result.duplicate) {
      return NextResponse.json(
        { message: "Duplicate transaction, skipped" },
        { status: 409 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Transaction created" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
