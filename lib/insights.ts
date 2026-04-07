import { Transaction, Budget } from "./types";
import { BUDGET_AMOUNTS, BENEFICIAL_CATEGORIES } from "./constants";
import { toEGP } from "./utils";

// Categories excluded from advisor/challenge/streak analysis
export const NON_DISCRETIONARY = ["Rent", "Loans & Installments", "Investments"];

// Categories excluded from merchant ranking
export const EXCLUDE_FROM_MERCHANTS = ["Instapay Transfers", "Cash Withdrawal"];

// ─── Helper: getMonthlyTotals ────────────────────────────────────────────────

export function getMonthlyTotals(
  transactions: Transaction[]
): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    if (!result.has(t.year_month)) result.set(t.year_month, new Map());
    const monthMap = result.get(t.year_month)!;
    const amt = toEGP(Number(t.amount), t.currency);
    monthMap.set(t.category, (monthMap.get(t.category) || 0) + amt);
    monthMap.set("__TOTAL__", (monthMap.get("__TOTAL__") || 0) + amt);
  }
  return result;
}

// ─── Section 1: Pace Headline ────────────────────────────────────────────────

export interface PaceHeadline {
  isCurrentMonth: boolean;
  dayOfMonth: number;
  daysInMonth: number;
  totalSpend: number;
  previousMonthTotal: number;
  pacePercentage: number;
  projectedTotal: number;
  pacing: "under" | "over" | "on_track";
  categoriesImproved: number;
  categoriesWorsened: number;
  noData: boolean;
}

export function computePaceHeadline(
  selectedMonth: string,
  monthlyTotals: Map<string, Map<string, number>>
): PaceHeadline {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedMonth === currentMonth;

  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = isCurrentMonth ? today.getDate() : daysInMonth;

  const totalSpend = monthlyTotals.get(selectedMonth)?.get("__TOTAL__") ?? 0;

  // Previous month
  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const previousMonthTotal = monthlyTotals.get(prevMonth)?.get("__TOTAL__") ?? 0;

  const noData = totalSpend === 0 && previousMonthTotal === 0;

  const pacePercentage =
    previousMonthTotal > 0 ? (totalSpend / previousMonthTotal) * 100 : 0;
  const projectedTotal =
    dayOfMonth > 0 ? (totalSpend / dayOfMonth) * daysInMonth : 0;

  const expectedPct = (dayOfMonth / daysInMonth) * 100;
  const pacing: "under" | "over" | "on_track" =
    pacePercentage < expectedPct - 5
      ? "under"
      : pacePercentage > expectedPct + 5
      ? "over"
      : "on_track";

  // Completed month: count categories improved/worsened
  let categoriesImproved = 0;
  let categoriesWorsened = 0;
  if (!isCurrentMonth) {
    const curMap = monthlyTotals.get(selectedMonth) || new Map<string, number>();
    const prevMap = monthlyTotals.get(prevMonth) || new Map<string, number>();
    const allCats = new Set([...curMap.keys(), ...prevMap.keys()]);
    allCats.delete("__TOTAL__");
    for (const cat of allCats) {
      if (NON_DISCRETIONARY.includes(cat)) continue;
      const cur = curMap.get(cat) ?? 0;
      const prev = prevMap.get(cat) ?? 0;
      if (cur < prev) categoriesImproved++;
      else if (cur > prev) categoriesWorsened++;
    }
  }

  return {
    isCurrentMonth,
    dayOfMonth,
    daysInMonth,
    totalSpend,
    previousMonthTotal,
    pacePercentage,
    projectedTotal,
    pacing,
    categoriesImproved,
    categoriesWorsened,
    noData,
  };
}

// ─── Section 2: Heatmap Calendar ────────────────────────────────────────────

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  total: number;
  transactions: number;
  topMerchants: string[];
  intensity: number; // 0-5
  isFuture: boolean;
}

export function computeHeatmap(
  selectedMonth: string,
  transactions: Transaction[]
): HeatmapDay[] {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const [year, month] = selectedMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Group by date — exclude NON_DISCRETIONARY from intensity total (rent/loans/investments
  // are fixed debits that would dominate the gradient and obscure day-to-day spending)
  const byDate = new Map<string, { total: number; merchants: Map<string, number> }>();
  for (const t of transactions) {
    if (t.year_month !== selectedMonth) continue;
    const date = t.transaction_date.split("T")[0];
    if (!byDate.has(date)) byDate.set(date, { total: 0, merchants: new Map() });
    const day = byDate.get(date)!;
    const amt = toEGP(Number(t.amount), t.currency);
    if (!NON_DISCRETIONARY.includes(t.category)) day.total += amt;
    const m = t.merchant_name || "Unknown";
    day.merchants.set(m, (day.merchants.get(m) || 0) + amt);
  }

  // Threshold-based intensity (EGP absolute scale)
  function getIntensity(total: number): number {
    if (total === 0) return 0;
    if (total < 200) return 1;
    if (total < 1000) return 2;
    if (total < 5000) return 3;
    if (total < 20000) return 4;
    return 5;
  }

  const result: HeatmapDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${selectedMonth}-${String(d).padStart(2, "0")}`;
    const isFuture = date > todayStr;
    const dayData = byDate.get(date);
    const total = dayData?.total ?? 0;
    const topMerchants = dayData
      ? Array.from(dayData.merchants.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([name]) => name)
      : [];
    result.push({
      date,
      total,
      transactions: dayData
        ? transactions.filter((t) => t.year_month === selectedMonth && t.transaction_date.split("T")[0] === date).length
        : 0,
      topMerchants,
      intensity: isFuture ? 0 : getIntensity(total),
      isFuture,
    });
  }
  return result;
}

// ─── Section 3: Streaks ──────────────────────────────────────────────────────

export interface CategoryStreak {
  category: string;
  streakMonths: number;
  isActive: boolean;
  status: "alive" | "broken" | "at_risk";
  monthHistory: { month: string; underBudget: boolean; hasData: boolean }[];
}

export function computeStreaks(
  monthlyTotals: Map<string, Map<string, number>>,
  budgets: Budget[],
  selectedMonth: string
): CategoryStreak[] {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedMonth === currentMonth;

  const budgetMap = new Map<string, number>();
  for (const b of budgets) budgetMap.set(b.category, Number(b.budgeted_amount));
  for (const [cat, amt] of Object.entries(BUDGET_AMOUNTS)) {
    if (!budgetMap.has(cat)) budgetMap.set(cat, amt);
  }

  // Get sorted months descending (all months with data)
  const allMonths = Array.from(monthlyTotals.keys()).sort().reverse();

  // For streak calc, use months up to (but not including) current month if current
  const completedMonths = isCurrentMonth
    ? allMonths.filter((m) => m < currentMonth)
    : allMonths.filter((m) => m <= selectedMonth);

  // Get all discretionary categories
  const allCats = new Set<string>();
  for (const [, catMap] of monthlyTotals) {
    for (const cat of catMap.keys()) {
      if (cat !== "__TOTAL__" && !NON_DISCRETIONARY.includes(cat)) allCats.add(cat);
    }
  }

  // Build last 12 months ending at selectedMonth (oldest → newest)
  const [sy, sm] = selectedMonth.split("-").map(Number);
  const last12: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(sy, sm - 1 - i, 1);
    last12.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const results: CategoryStreak[] = [];

  for (const category of allCats) {
    const budget = budgetMap.get(category) ?? 0;
    if (budget === 0) continue;

    // Count consecutive under-budget months walking backward
    let streak = 0;
    for (const m of completedMonths) {
      const spend = monthlyTotals.get(m)?.get(category) ?? 0;
      if (spend <= budget) streak++;
      else break;
    }

    const isActive = streak > 0 && completedMonths.length > 0;

    let status: "alive" | "broken" | "at_risk" = "broken";
    if (isCurrentMonth) {
      const spendSoFar = monthlyTotals.get(selectedMonth)?.get(category) ?? 0;
      const daysElapsed = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const projected = daysElapsed > 0 ? (spendSoFar / daysElapsed) * daysInMonth : 0;
      status = projected > budget ? "at_risk" : "alive";
    } else {
      const spend = monthlyTotals.get(selectedMonth)?.get(category) ?? 0;
      status = spend <= budget ? "alive" : "broken";
    }

    const monthHistory = last12.map((m) => {
      const spend = monthlyTotals.get(m)?.get(category) ?? 0;
      return { month: m, underBudget: spend <= budget, hasData: spend > 0 };
    });

    if (streak >= 2 || (streak >= 1 && status === "broken")) {
      results.push({ category, streakMonths: streak, isActive, status, monthHistory });
    }
  }

  return results.sort((a, b) => {
    const order = { alive: 0, at_risk: 1, broken: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.streakMonths - a.streakMonths;
  });
}

// ─── Section 3b: Movers ──────────────────────────────────────────────────────

export interface CategoryMover {
  category: string;
  currentTotal: number;
  previousTotal: number;
  deltaPercent: number;
  deltaAbsolute: number;
  direction: "up" | "down";
  isBeneficial: boolean;
  sparklineData: number[];
}

export function computeMovers(
  monthlyTotals: Map<string, Map<string, number>>,
  selectedMonth: string,
  last6Months: string[]
): CategoryMover[] {
  const [year, month] = selectedMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const curMap = monthlyTotals.get(selectedMonth) || new Map<string, number>();
  const prevMap = monthlyTotals.get(prevMonth) || new Map<string, number>();

  const allCats = new Set([...curMap.keys(), ...prevMap.keys()]);
  allCats.delete("__TOTAL__");

  const results: CategoryMover[] = [];

  for (const category of allCats) {
    const cur = curMap.get(category) ?? 0;
    const prev = prevMap.get(category) ?? 0;
    if (cur === 0 && prev === 0) continue;

    const deltaAbsolute = cur - prev;
    const deltaPercent = prev > 0 ? (deltaAbsolute / prev) * 100 : cur > 0 ? 100 : 0;

    const sparklineData = last6Months.map(
      (m) => monthlyTotals.get(m)?.get(category) ?? 0
    );

    results.push({
      category,
      currentTotal: cur,
      previousTotal: prev,
      deltaPercent,
      deltaAbsolute,
      direction: deltaAbsolute >= 0 ? "up" : "down",
      isBeneficial: (BENEFICIAL_CATEGORIES as readonly string[]).includes(category),
      sparklineData,
    });
  }

  return results
    .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent))
    .slice(0, 6);
}

// ─── Section 4: Merchant Loyalty ────────────────────────────────────────────

export interface MerchantLoyalty {
  merchantName: string;
  visitCount: number;
  totalSpend: number;
  category: string;
  transactions: Transaction[];
}

export function computeMerchantLoyalty(
  transactions: Transaction[],
  selectedMonth: string
): MerchantLoyalty[] {
  const filtered = transactions.filter(
    (t) =>
      t.year_month === selectedMonth &&
      t.merchant_name &&
      t.merchant_name.trim() !== "" &&
      !EXCLUDE_FROM_MERCHANTS.includes(t.category)
  );

  const byMerchant = new Map<string, Transaction[]>();
  for (const t of filtered) {
    const key = (t.merchant_name || "").trim().toLowerCase();
    if (!byMerchant.has(key)) byMerchant.set(key, []);
    byMerchant.get(key)!.push(t);
  }

  const results: MerchantLoyalty[] = [];
  for (const [, txns] of byMerchant) {
    const totalSpend = txns.reduce(
      (sum, t) => sum + toEGP(Number(t.amount), t.currency),
      0
    );
    // Primary category = most common
    const catCount = new Map<string, number>();
    for (const t of txns) catCount.set(t.category, (catCount.get(t.category) || 0) + 1);
    const category = Array.from(catCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Others";

    results.push({
      merchantName: txns[0].merchant_name!,
      visitCount: txns.length,
      totalSpend,
      category,
      transactions: txns.sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      ),
    });
  }

  return results
    .sort((a, b) => b.visitCount - a.visitCount || b.totalSpend - a.totalSpend)
    .slice(0, 5);
}

// ─── Section 5: Advisor ──────────────────────────────────────────────────────

export interface AdvisorInsight {
  type: "warning" | "celebration" | "no_data";
  category: string;
  headline: string;
  detail: string;
  projectedMonthly: number;
  projectedAnnual: number;
}

export function computeAdvisor(
  monthlyTotals: Map<string, Map<string, number>>,
  selectedMonth: string
): AdvisorInsight {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedMonth === currentMonth;

  const sortedMonths = Array.from(monthlyTotals.keys()).sort();

  if (sortedMonths.length < 2) {
    return {
      type: "no_data",
      category: "",
      headline: "Not enough data yet",
      detail: "Check back after a few months of tracking.",
      projectedMonthly: 0,
      projectedAnnual: 0,
    };
  }

  // All discretionary categories
  const allCats = new Set<string>();
  for (const [, catMap] of monthlyTotals) {
    for (const cat of catMap.keys()) {
      if (cat !== "__TOTAL__" && !NON_DISCRETIONARY.includes(cat)) allCats.add(cat);
    }
  }

  let bestWarningCategory = "";
  let bestWarningScore = -Infinity;
  let bestCelebrationCategory = "";
  let bestCelebrationScore = -Infinity;

  for (const category of allCats) {
    const monthlySeries = sortedMonths
      .filter((m) => m <= selectedMonth)
      .map((m) => monthlyTotals.get(m)?.get(category) ?? 0);

    if (monthlySeries.length < 2) continue;

    // Consecutive increase count (walking backward from most recent)
    let consecutiveIncrease = 0;
    for (let i = monthlySeries.length - 1; i > 0; i--) {
      if (monthlySeries[i] > monthlySeries[i - 1]) consecutiveIncrease++;
      else break;
    }

    // 3-month acceleration
    let acceleration = 0;
    if (monthlySeries.length >= 6) {
      const recent = monthlySeries.slice(-3);
      const older = monthlySeries.slice(-6, -3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / 3;
      const olderAvg = older.reduce((a, b) => a + b, 0) / 3;
      acceleration = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    }

    const score = consecutiveIncrease * 2 + Math.max(acceleration, 0) / 10;

    // Consecutive decrease (for celebration)
    let consecutiveDecrease = 0;
    for (let i = monthlySeries.length - 1; i > 0; i--) {
      if (monthlySeries[i] < monthlySeries[i - 1]) consecutiveDecrease++;
      else break;
    }
    const celebScore = consecutiveDecrease * 2 + Math.max(-acceleration, 0) / 10;

    if (score > bestWarningScore) {
      bestWarningScore = score;
      bestWarningCategory = category;
    }
    if (celebScore > bestCelebrationScore) {
      bestCelebrationScore = celebScore;
      bestCelebrationCategory = category;
    }
  }

  const useWarning = bestWarningScore > 0;
  const category = useWarning ? bestWarningCategory : bestCelebrationCategory;

  if (!category) {
    return {
      type: "no_data",
      category: "",
      headline: "All categories look stable",
      detail: "No significant trends to report.",
      projectedMonthly: 0,
      projectedAnnual: 0,
    };
  }

  const spendSoFar = monthlyTotals.get(selectedMonth)?.get(category) ?? 0;
  let projectedMonthly = spendSoFar;
  if (isCurrentMonth) {
    const daysElapsed = today.getDate();
    const [y, m] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    projectedMonthly =
      daysElapsed >= 5
        ? (spendSoFar / daysElapsed) * daysInMonth
        : spendSoFar;
  }
  const projectedAnnual = projectedMonthly * 12;

  // Compute delta for detail string
  const catSeries = sortedMonths
    .filter((m) => m <= selectedMonth)
    .map((m) => monthlyTotals.get(m)?.get(category) ?? 0);
  const startVal = catSeries[Math.max(0, catSeries.length - 4)];
  const endVal = catSeries[catSeries.length - 1];
  const delta =
    startVal > 0 ? Math.round(((endVal - startVal) / startVal) * 100) : 0;
  const startMonthLabel = sortedMonths[Math.max(0, sortedMonths.length - 4)];

  if (useWarning) {
    const consecutiveMonths = Math.floor(bestWarningScore / 2);
    return {
      type: "warning",
      category,
      headline: `${category} has been climbing`,
      detail: `Up ${Math.abs(delta)}% since ${startMonthLabel} — ${consecutiveMonths} consecutive months`,
      projectedMonthly,
      projectedAnnual,
    };
  } else {
    const consecutiveMonths = Math.floor(bestCelebrationScore / 2);
    return {
      type: "celebration",
      category,
      headline: `${category} is improving`,
      detail: `Down ${Math.abs(delta)}% since ${startMonthLabel} — ${consecutiveMonths} consecutive months`,
      projectedMonthly,
      projectedAnnual,
    };
  }
}

// ─── Section 6: Monthly Challenge ───────────────────────────────────────────

export interface MonthlyChallenge {
  category: string;
  targetAmount: number;
  currentSpend: number;
  progress: number;
  status: "in_progress" | "on_track" | "at_risk" | "succeeded" | "failed";
  label: string;
}

export function computeChallenge(
  advisor: AdvisorInsight,
  monthlyTotals: Map<string, Map<string, number>>,
  selectedMonth: string
): MonthlyChallenge | null {
  if (advisor.type === "no_data" || !advisor.category) return null;

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedMonth === currentMonth;

  const category = advisor.category;

  // Target = 3-month average before selectedMonth
  const [year, month] = selectedMonth.split("-").map(Number);
  const prev3: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(year, month - 1 - i, 1);
    prev3.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const prev3Values = prev3
    .map((m) => monthlyTotals.get(m)?.get(category) ?? 0)
    .filter((v) => v > 0);
  const targetAmount =
    prev3Values.length > 0
      ? prev3Values.reduce((a, b) => a + b, 0) / prev3Values.length
      : 0;

  if (targetAmount === 0) return null;

  const currentSpend = monthlyTotals.get(selectedMonth)?.get(category) ?? 0;
  const progress = (currentSpend / targetAmount) * 100;

  let status: MonthlyChallenge["status"];
  if (!isCurrentMonth) {
    status = currentSpend <= targetAmount ? "succeeded" : "failed";
  } else {
    const daysElapsed = today.getDate();
    const [y, m] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const projected =
      daysElapsed > 0 ? (currentSpend / daysElapsed) * daysInMonth : 0;
    if (currentSpend > targetAmount) status = "failed";
    else if (projected > targetAmount) status = "at_risk";
    else status = "on_track";
  }

  const label =
    advisor.type === "celebration"
      ? `Match your best: ${category} under EGP ${Math.round(targetAmount).toLocaleString()}`
      : `Keep ${category} under EGP ${Math.round(targetAmount).toLocaleString()}`;

  return { category, targetAmount, currentSpend, progress, status, label };
}
