import { supabase } from "./supabase";
import { getTransactionsByMonths } from "./queries";
import { getLast12Months, getLast6Months, toEGP } from "./utils";
import { FIXED_CATEGORIES } from "./constants";

const EXCLUDED_MERCHANT_CATEGORIES = ["Instapay Transfers", "Cash Withdrawal"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface MonthlyAverage {
  category: string;
  avg_12m: number;
  last_3m_avg: number;
}

export interface FixedCost {
  category: string;
  avg_monthly: number;
}

export interface CurrentMonthActual {
  category: string;
  spent: number;
  tx_count: number;
  days_elapsed: number;
}

export interface MonthlyTotal {
  month: string;
  category: string;
  total: number;
  tx_count: number;
}

export interface TopMerchant {
  merchant: string;
  total_3m: number;
  tx_count: number;
  category: string;
}

export interface DayOfWeekPattern {
  day: string;
  avg_daily_spend: number;
}

export interface ActiveGoal {
  id: string;
  target: number;
  target_currency: string;
  month: string;
  status: string;
}

export interface AgentContext {
  monthly_averages: MonthlyAverage[];
  fixed_costs: FixedCost[];
  current_month_actuals: CurrentMonthActual[];
  monthly_totals: MonthlyTotal[];
  top_merchants: TopMerchant[];
  day_of_week_pattern: DayOfWeekPattern[];
  total_discretionary_avg: number;
  active_goal: ActiveGoal | null;
  currency: string;
  today: string;
  days_elapsed: number;
  days_remaining: number;
}

export async function buildAgentContext(): Promise<AgentContext> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  const last12 = getLast12Months();
  const last6 = getLast6Months();
  const last3 = last12.slice(-3);

  const txns = await getTransactionsByMonths(last12);
  const txnsEGP = txns.map((t) => ({
    ...t,
    amountEGP: toEGP(Number(t.amount), t.currency),
  }));

  // Per month+category totals (for averages and monthly_totals)
  const monthlyCatMap = new Map<string, { total: number; count: number }>();
  for (const t of txnsEGP) {
    const key = `${t.year_month}|${t.category}`;
    const e = monthlyCatMap.get(key) ?? { total: 0, count: 0 };
    e.total += t.amountEGP;
    e.count += 1;
    monthlyCatMap.set(key, e);
  }

  // Aggregate per category across 12m and 3m windows
  const cat12m = new Map<string, number[]>();
  const cat3m = new Map<string, number[]>();
  for (const [key, val] of monthlyCatMap) {
    const [month, category] = key.split("|");
    if (last12.includes(month)) {
      const arr = cat12m.get(category) ?? [];
      arr.push(val.total);
      cat12m.set(category, arr);
    }
    if (last3.includes(month)) {
      const arr = cat3m.get(category) ?? [];
      arr.push(val.total);
      cat3m.set(category, arr);
    }
  }

  const fixedSet = new Set<string>(FIXED_CATEGORIES);

  // Discretionary averages
  const monthly_averages: MonthlyAverage[] = [];
  for (const [category, totals] of cat12m) {
    if (fixedSet.has(category)) continue;
    const avg_12m = Math.round(totals.reduce((s, v) => s + v, 0) / 12);
    const t3 = cat3m.get(category) ?? [];
    const last_3m_avg = t3.length > 0
      ? Math.round(t3.reduce((s, v) => s + v, 0) / 3)
      : avg_12m;
    monthly_averages.push({ category, avg_12m, last_3m_avg });
  }
  monthly_averages.sort((a, b) => b.avg_12m - a.avg_12m);

  // Fixed costs
  const fixed_costs: FixedCost[] = [];
  for (const category of FIXED_CATEGORIES) {
    const totals = cat12m.get(category) ?? [];
    const avg_monthly = totals.length > 0
      ? Math.round(totals.reduce((s, v) => s + v, 0) / 12)
      : 0;
    if (avg_monthly > 0) fixed_costs.push({ category, avg_monthly });
  }

  // Current month actuals
  const currentTxns = txnsEGP.filter((t) => t.year_month === currentMonth);
  const currentCatMap = new Map<string, { total: number; count: number }>();
  for (const t of currentTxns) {
    const e = currentCatMap.get(t.category) ?? { total: 0, count: 0 };
    e.total += t.amountEGP;
    e.count += 1;
    currentCatMap.set(t.category, e);
  }
  const current_month_actuals: CurrentMonthActual[] = Array.from(currentCatMap.entries())
    .map(([category, { total, count }]) => ({
      category,
      spent: Math.round(total),
      tx_count: count,
      days_elapsed: daysElapsed,
    }))
    .sort((a, b) => b.spent - a.spent);

  // Monthly totals (last 6 months)
  const monthly_totals: MonthlyTotal[] = [];
  for (const [key, val] of monthlyCatMap) {
    const [month, category] = key.split("|");
    if (!last6.includes(month)) continue;
    monthly_totals.push({ month, category, total: Math.round(val.total), tx_count: val.count });
  }
  monthly_totals.sort((a, b) => a.month.localeCompare(b.month) || b.total - a.total);

  // Top merchants (last 3 months, excluding noise categories)
  const merchantMap = new Map<string, { total: number; count: number; category: string }>();
  for (const t of txnsEGP) {
    if (!last3.includes(t.year_month)) continue;
    if (EXCLUDED_MERCHANT_CATEGORIES.includes(t.category)) continue;
    if (!t.merchant_name) continue;
    const e = merchantMap.get(t.merchant_name) ?? { total: 0, count: 0, category: t.category };
    e.total += t.amountEGP;
    e.count += 1;
    merchantMap.set(t.merchant_name, e);
  }
  const top_merchants: TopMerchant[] = Array.from(merchantMap.entries())
    .map(([merchant, { total, count, category }]) => ({
      merchant,
      total_3m: Math.round(total),
      tx_count: count,
      category,
    }))
    .sort((a, b) => b.total_3m - a.total_3m)
    .slice(0, 10);

  // Day-of-week average spend — group by date first, then by weekday
  const dailyMap = new Map<string, { total: number; day: number }>();
  for (const t of txnsEGP) {
    const dateKey = t.transaction_date.substring(0, 10);
    const e = dailyMap.get(dateKey) ?? { total: 0, day: new Date(t.transaction_date).getDay() };
    e.total += t.amountEGP;
    dailyMap.set(dateKey, e);
  }
  const dowMap = new Map<number, number[]>();
  for (const { total, day } of dailyMap.values()) {
    const arr = dowMap.get(day) ?? [];
    arr.push(total);
    dowMap.set(day, arr);
  }
  const day_of_week_pattern: DayOfWeekPattern[] = DAY_NAMES.map((day, i) => {
    const amounts = dowMap.get(i) ?? [];
    const avg_daily_spend = amounts.length > 0
      ? Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length)
      : 0;
    return { day, avg_daily_spend };
  });

  const total_discretionary_avg = monthly_averages.reduce((sum, c) => sum + c.avg_12m, 0);

  // Active goal for current month (table may not exist yet during dev)
  let active_goal: ActiveGoal | null = null;
  try {
    const { data } = await supabase
      .from("savings_goals")
      .select("id, target_amount, target_currency, month, status")
      .eq("status", "active")
      .eq("month", `${currentMonth}-01`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      active_goal = {
        id: data.id,
        target: Number(data.target_amount),
        target_currency: data.target_currency,
        month: data.month,
        status: data.status,
      };
    }
  } catch {
    // Table not yet created
  }

  return {
    monthly_averages,
    fixed_costs,
    current_month_actuals,
    monthly_totals,
    top_merchants,
    day_of_week_pattern,
    total_discretionary_avg,
    active_goal,
    currency: "EGP",
    today: now.toISOString().split("T")[0],
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
  };
}
