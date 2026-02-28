"use client";

import Link from "next/link";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { MonthlyCategorySpend } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_SLUGS, BUDGET_AMOUNTS } from "@/lib/constants";
import { formatCurrency, getMonthLabel } from "@/lib/utils";

interface HeatmapTableProps {
  data: MonthlyCategorySpend[];
  months: string[];
  categories: string[];
}

export default function HeatmapTable({
  data,
  months,
  categories,
}: HeatmapTableProps) {
  const { privacyMode } = usePrivacy();

  const getIntensity = (amount: number, category: string): number => {
    const budget = BUDGET_AMOUNTS[category] || 1000;
    return Math.min(amount / budget, 2);
  };

  const getCellBg = (intensity: number): string => {
    if (intensity === 0) return "bg-slate-800/50";
    if (intensity < 0.5) return "bg-accent-green/20";
    if (intensity < 0.8) return "bg-accent-yellow/20";
    if (intensity < 1) return "bg-accent-yellow/40";
    return "bg-accent-red/30";
  };

  const getValue = (category: string, month: string): number => {
    const found = data.find(
      (d) => d.category === category && d.year_month === month
    );
    return found ? found.total : 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 text-text-secondary font-medium">
              Category
            </th>
            {months.map((m) => (
              <th
                key={m}
                className="text-right py-2 px-3 text-text-secondary font-medium"
              >
                {getMonthLabel(m).split(" ")[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat} className="border-t border-slate-700/30">
              <td className="py-2 px-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: CATEGORY_COLORS[cat] || "#6B7280",
                    }}
                  />
                  <span className="text-text-primary text-xs">{cat}</span>
                </div>
              </td>
              {months.map((month) => {
                const value = getValue(cat, month);
                const intensity = getIntensity(value, cat);
                const slug = CATEGORY_SLUGS[cat] || cat.toLowerCase();
                return (
                  <td key={month} className="py-1 px-1">
                    <Link
                      href={`/categories/${slug}?month=${month}`}
                      className={`block text-right px-2 py-1.5 rounded text-xs
                        transition-colors hover:ring-1 hover:ring-accent-blue/50
                        ${getCellBg(intensity)}`}
                    >
                      {value === 0
                        ? "—"
                        : privacyMode
                        ? `${(intensity * 100).toFixed(0)}%`
                        : formatCurrency(value)}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
