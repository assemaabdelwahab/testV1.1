import { QuarterInfo } from "./types";
import { CATEGORIES } from "./constants";

// Explicit aliases for known DeepSeek/sheet variants → canonical category names
const CATEGORY_ALIASES: Record<string, string> = {
  cashwithdrawal: "Cash Withdrawal",
  diningout: "Dining Out",
  onlinefooddelivery: "Online Food Delivery",
  investment: "Investments",
  "food delivery": "Online Food Delivery",
  food: "Dining Out",
  dining: "Dining Out",
  transport: "Transportation",
  instapay: "Instapay Transfers",
  bills: "Bills & Utilities",
  utilities: "Bills & Utilities",
  health: "Health & Wellness",
  wellness: "Health & Wellness",
  loan: "Loans & Installments",
  loans: "Loans & Installments",
  installments: "Loans & Installments",
  subscription: "Subscriptions",
};

export function normalizeCategory(raw: string): string {
  const trimmed = raw?.trim() ?? "";
  // 1. Exact match against canonical list
  if ((CATEGORIES as readonly string[]).includes(trimmed)) return trimmed;
  // 2. Case-insensitive exact match
  const lower = trimmed.toLowerCase();
  const exactCI = CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (exactCI) return exactCI;
  // 3. Alias lookup (handles camelCase and common shorthand)
  const noSpaceLower = lower.replace(/\s+/g, "");
  if (CATEGORY_ALIASES[lower]) return CATEGORY_ALIASES[lower];
  if (CATEGORY_ALIASES[noSpaceLower]) return CATEGORY_ALIASES[noSpaceLower];
  // 4. Fallback
  return "Others";
}

export function formatCurrency(amount: number): string {
  return `EGP ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getQuarterInfo(key: string): QuarterInfo {
  const [yearStr, qStr] = key.split("-Q");
  const year = parseInt(yearStr);
  const quarter = parseInt(qStr);
  const startMonth = (quarter - 1) * 3 + 1;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const months = Array.from({ length: 3 }, (_, i) => {
    const m = startMonth + i;
    return `${year}-${String(m).padStart(2, "0")}`;
  });

  const monthLabels = Array.from({ length: 3 }, (_, i) => {
    return monthNames[startMonth + i - 1];
  });

  return {
    label: `Q${quarter} ${year}: ${monthLabels[0]} – ${monthLabels[2]}`,
    quarter,
    year,
    months,
    monthLabels,
    key,
  };
}

export function getCurrentQuarterKey(): string {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${quarter}`;
}

export function getPrevQuarterKey(key: string): string {
  const [yearStr, qStr] = key.split("-Q");
  let year = parseInt(yearStr);
  let quarter = parseInt(qStr) - 1;
  if (quarter < 1) {
    quarter = 4;
    year -= 1;
  }
  return `${year}-Q${quarter}`;
}

export function getNextQuarterKey(key: string): string {
  const [yearStr, qStr] = key.split("-Q");
  let year = parseInt(yearStr);
  let quarter = parseInt(qStr) + 1;
  if (quarter > 4) {
    quarter = 1;
    year += 1;
  }
  return `${year}-Q${quarter}`;
}

export function getCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}

export function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}
