import { supabase } from "./supabase";
import {
  Transaction,
  Budget,
  CategorySpend,
  MonthlySpend,
  MonthlyCategorySpend,
  BudgetComparison,
  MerchantGroup,
} from "./types";
import { BUDGET_AMOUNTS } from "./constants";
import { normalizeCategory } from "./utils";

export async function getTransactionsByMonths(
  months: string[]
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .in("year_month", months)
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSpendByMonth(
  months: string[]
): Promise<MonthlySpend[]> {
  const txns = await getTransactionsByMonths(months);
  const map = new Map<string, number>();
  for (const t of txns) {
    map.set(t.year_month, (map.get(t.year_month) || 0) + Number(t.amount));
  }
  return Array.from(map.entries())
    .map(([year_month, total]) => ({ year_month, total }))
    .sort((a, b) => a.year_month.localeCompare(b.year_month));
}

export async function getSpendByCategory(
  months: string[]
): Promise<CategorySpend[]> {
  const txns = await getTransactionsByMonths(months);
  const map = new Map<string, { total: number; count: number }>();
  for (const t of txns) {
    const existing = map.get(t.category) || { total: 0, count: 0 };
    existing.total += Number(t.amount);
    existing.count += 1;
    map.set(t.category, existing);
  }
  return Array.from(map.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);
}

export async function getSpendByCategoryAndMonth(
  months: string[]
): Promise<MonthlyCategorySpend[]> {
  const txns = await getTransactionsByMonths(months);
  const map = new Map<string, number>();
  for (const t of txns) {
    const key = `${t.year_month}|${t.category}`;
    map.set(key, (map.get(key) || 0) + Number(t.amount));
  }
  return Array.from(map.entries())
    .map(([key, total]) => {
      const [year_month, category] = key.split("|");
      return { year_month, category, total };
    })
    .sort((a, b) => a.year_month.localeCompare(b.year_month));
}

export async function getBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from("budgets").select("*");
  if (error) throw error;
  return data || [];
}

export async function getBudgetComparison(
  month: string
): Promise<BudgetComparison[]> {
  const [categorySpend, budgets] = await Promise.all([
    getSpendByCategory([month]),
    getBudgets(),
  ]);

  const budgetMap = new Map<string, number>();
  for (const b of budgets) {
    budgetMap.set(b.category, Number(b.budgeted_amount));
  }

  // Include all budget categories even with 0 spend
  const allCategories = new Set([
    ...budgetMap.keys(),
    ...categorySpend.map((s) => s.category),
  ]);

  return Array.from(allCategories)
    .map((category) => {
      const budgeted =
        budgetMap.get(category) ?? BUDGET_AMOUNTS[category] ?? 0;
      const actual =
        categorySpend.find((s) => s.category === category)?.total ?? 0;
      const remaining = budgeted - actual;
      const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
      return { category, budgeted_amount: budgeted, actual, remaining, percentage };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export async function getTransactionsByCategory(
  category: string,
  month: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("category", category)
    .eq("year_month", month)
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMerchantGroups(
  category: string,
  month: string
): Promise<MerchantGroup[]> {
  const transactions = await getTransactionsByCategory(category, month);
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = t.merchant_name || "Unknown";
    const list = map.get(key) || [];
    list.push(t);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .map(([merchant_name, transactions]) => ({
      merchant_name,
      total: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      count: transactions.length,
      transactions,
    }))
    .sort((a, b) => b.total - a.total);
}

export async function getCategorySpendHistory(
  category: string,
  months: string[]
): Promise<MonthlySpend[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("category", category)
    .in("year_month", months);
  if (error) throw error;

  const map = new Map<string, number>();
  for (const m of months) map.set(m, 0);
  for (const t of data || []) {
    map.set(t.year_month, (map.get(t.year_month) || 0) + Number(t.amount));
  }
  return months.map((year_month) => ({
    year_month,
    total: map.get(year_month) || 0,
  }));
}

export async function insertTransaction(txn: {
  category: string;
  merchant_name?: string;
  amount: number;
  transaction_date: string;
}): Promise<{ success: boolean; duplicate?: boolean; error?: string }> {
  const { error } = await supabase.from("transactions").insert({
    category: normalizeCategory(txn.category),
    merchant_name: txn.merchant_name || null,
    amount: txn.amount,
    transaction_date: txn.transaction_date,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, duplicate: true };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}
