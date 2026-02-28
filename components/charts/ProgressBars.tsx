"use client";

import { usePrivacy } from "@/contexts/PrivacyContext";
import { BudgetComparison } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";

interface ProgressBarsProps {
  data: BudgetComparison[];
}

export default function ProgressBars({ data }: ProgressBarsProps) {
  const { privacyMode } = usePrivacy();

  const getBarColor = (percentage: number, isInvestment: boolean) => {
    if (isInvestment) return "bg-accent-green";
    if (percentage >= 100) return "bg-accent-red";
    if (percentage >= 80) return "bg-accent-yellow";
    return "bg-accent-green";
  };

  const getStatusText = (item: BudgetComparison, isInvestment: boolean) => {
    if (privacyMode) return `${item.percentage.toFixed(0)}%`;
    if (isInvestment) {
      return item.remaining >= 0
        ? `${formatCurrency(item.remaining)} remaining`
        : `${formatCurrency(Math.abs(item.remaining))} above target`;
    }
    return item.remaining >= 0
      ? `${formatCurrency(item.remaining)} remaining`
      : `${formatCurrency(Math.abs(item.remaining))} over budget`;
  };

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const isInvestment = item.category === "Investments";
        const barWidth = Math.min(item.percentage, 100);

        return (
          <div key={item.category} className={`p-3 rounded-lg bg-bg-primary ${isInvestment ? "border border-accent-green/30" : ""}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: CATEGORY_COLORS[item.category] || "#6B7280",
                  }}
                />
                <span className="text-sm font-medium text-text-primary">
                  {item.category}
                </span>
                {isInvestment && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">
                    savings target
                  </span>
                )}
              </div>
              <span className="text-xs text-text-secondary">
                {privacyMode
                  ? `${item.percentage.toFixed(0)}%`
                  : `${formatCurrency(item.actual)} / ${formatCurrency(item.budgeted_amount)}`}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(item.percentage, isInvestment)}`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between items-center">
              <span
                className={`text-xs ${
                  !isInvestment && item.percentage >= 100
                    ? "text-accent-red"
                    : "text-text-secondary"
                }`}
              >
                {getStatusText(item, isInvestment)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
