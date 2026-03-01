/**
 * Seed script: Google Sheets → Supabase
 *
 * Reads transaction data from the Google Sheet and bulk inserts into Supabase.
 * Also seeds the budgets table with category budget amounts.
 *
 * Usage:
 *   npm run seed
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { BUDGET_AMOUNTS } from "../lib/constants";
import { normalizeCategory } from "../lib/utils";

const SHEET_ID = "1-Hi_rKNndjUwr2xiXOpnkwqxTTxJ6JxOeZUfe-EDRxw";
const RANGE = "Transactions!A:Z";

async function main() {
  console.log("Starting seed...");

  // Init Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Init Google Sheets
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  console.log("Fetching sheet data...");
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    console.log("No data found in sheet.");
    return;
  }

  // Find column indices from header row
  const headers = rows[0].map((h: string) => h.toLowerCase().trim());
  const categoryIdx = headers.findIndex(
    (h: string) => h.includes("category") || h.includes("recommended category")
  );
  const merchantIdx = headers.findIndex(
    (h: string) => h.includes("merchant") || h.includes("merchant name")
  );
  const amountIdx = headers.findIndex(
    (h: string) => h.includes("amount") || h.includes("transaction amount")
  );
  const dateIdx = headers.findIndex(
    (h: string) => h.includes("date") || h.includes("transaction date")
  );

  if (categoryIdx === -1 || amountIdx === -1 || dateIdx === -1) {
    console.error("Could not find required columns. Headers:", headers);
    return;
  }

  console.log(
    `Found columns: category=${categoryIdx}, merchant=${merchantIdx}, amount=${amountIdx}, date=${dateIdx}`
  );

  // Parse transactions
  const transactions = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const category = row[categoryIdx]?.trim();
    const merchant_name = merchantIdx >= 0 ? row[merchantIdx]?.trim() || null : null;
    const rawAmount = row[amountIdx]?.toString().replace(/,/g, "").trim();
    const amount = parseFloat(rawAmount);
    const rawDate = row[dateIdx]?.trim();

    if (!category || isNaN(amount) || !rawDate) continue;

    // Parse date - handle multiple formats including Excel serial numbers
    let transaction_date: string;
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      transaction_date = rawDate;
    } else if (/^\d+$/.test(rawDate)) {
      // Excel serial number: days since Dec 30, 1899
      const serial = parseInt(rawDate, 10);
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      transaction_date = date.toISOString().split("T")[0];
    } else {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) continue;
      transaction_date = d.toISOString().split("T")[0];
    }

    transactions.push({
      category: normalizeCategory(category),
      merchant_name,
      amount,
      transaction_date,
    });
  }

  console.log(`Parsed ${transactions.length} transactions from sheet.`);

  // Bulk upsert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("transactions")
      .upsert(batch, {
        onConflict: "merchant_name,amount,transaction_date",
        ignoreDuplicates: true,
      });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  console.log(`Transactions: ${inserted} processed, ${skipped} errored.`);

  // Seed budgets
  console.log("Seeding budgets...");
  const budgets = Object.entries(BUDGET_AMOUNTS).map(
    ([category, budgeted_amount]) => ({
      category,
      budgeted_amount,
    })
  );

  const { error: budgetError } = await supabase
    .from("budgets")
    .upsert(budgets, { onConflict: "category", ignoreDuplicates: true });

  if (budgetError) {
    console.error("Budget seed error:", budgetError.message);
  } else {
    console.log(`Seeded ${budgets.length} budget categories.`);
  }

  console.log("Seed complete!");
}

main().catch(console.error);
