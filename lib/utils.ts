import { QuarterInfo } from "./types";

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
