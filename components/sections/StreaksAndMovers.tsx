"use client";

import Link from "next/link";
import { CategoryStreak, CategoryMover } from "@/lib/insights";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { formatCurrency, getMonthLabel } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_SLUGS } from "@/lib/constants";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  streaks: CategoryStreak[];
  movers: CategoryMover[];
  selectedMonth: string;
}

function StatusBadge({ status }: { status: CategoryStreak["status"] }) {
  if (status === "alive") return (
    <span className="text-[10px] font-medium text-signal-green bg-signal-green/10 px-1.5 py-0.5 rounded-full">active</span>
  );
  if (status === "at_risk") return (
    <span className="text-[10px] font-medium text-signal-amber bg-signal-amber/10 px-1.5 py-0.5 rounded-full">at risk</span>
  );
  return (
    <span className="text-[10px] font-medium text-signal-red bg-signal-red/10 px-1.5 py-0.5 rounded-full">broken</span>
  );
}

function MonthDots({ history }: { history: CategoryStreak["monthHistory"] }) {
  return (
    <div className="flex items-end gap-[3px] mt-2 ml-4">
      {[...history].reverse().map(({ month, underBudget, hasData }) => {
        let bg: string;
        if (!hasData) bg = "#2A2A38";
        else if (underBudget) bg = "#10B981";
        else bg = "#EF4444";

        const label = new Date(month + "-02").toLocaleDateString("en-US", { month: "short" });

        return (
          <div key={month} className="flex flex-col items-center gap-[3px]">
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: bg, flexShrink: 0 }} />
            <span style={{ fontSize: 6, color: "#6B7080", lineHeight: 1 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function StreaksAndMovers({ streaks, movers, selectedMonth }: Props) {
  const { privacyMode } = usePrivacy();
  const [year, month] = selectedMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonthLabel = getMonthLabel(
    `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`
  );

  const hasStreaks = streaks.length > 0;
  const hasMovers = movers.length > 0;

  if (!hasStreaks && !hasMovers) return null;

  return (
    <div className="px-5 space-y-8 fade-up" style={{ animationDelay: "0.15s" }}>
      {hasStreaks && (
        <div>
          <p className="section-label mb-4">Streaks</p>
          <div className="space-y-3">
            {streaks.slice(0, 5).map((s) => {
              const slug = CATEGORY_SLUGS[s.category] || s.category.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={s.category}
                  href={`/categories/${slug}?month=${selectedMonth}`}
                  className="card block hover:brightness-110 transition-[filter]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[s.category] || "#6B7080" }}
                        />
                        <span className="text-sm font-medium text-ink-primary truncate">{s.category}</span>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <MonthDots history={s.monthHistory} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {hasMovers && (
        <div>
          <p className="section-label mb-4">Movers vs {prevMonthLabel}</p>
          <div className="space-y-3">
            {movers.map((m) => {
              const isNegative = m.isBeneficial ? m.direction === "down" : m.direction === "up";
              const color = isNegative ? "#EF4444" : "#10B981";
              const sign = m.direction === "up" ? "+" : "";
              const sparkData = m.sparklineData.map((v, i) => ({ v, i }));
              const slug = CATEGORY_SLUGS[m.category] || m.category.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={m.category}
                  href={`/categories/${slug}?month=${selectedMonth}`}
                  className="card flex items-center gap-3 hover:brightness-110 transition-[filter]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[m.category] || "#6B7080" }}
                      />
                      <span className="text-sm font-medium text-ink-primary truncate">{m.category}</span>
                    </div>
                    <p className="text-xs mt-0.5 ml-4" style={{ color }}>
                      {sign}{Math.round(m.deltaPercent)}%
                      {!privacyMode && (
                        <span className="text-ink-secondary ml-1.5">
                          {sign}{formatCurrency(Math.abs(m.deltaAbsolute))}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="w-16 h-8 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={CATEGORY_COLORS[m.category] || "#6B7080"}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Link>
              );
            })}
          </div>

          <Link
            href={`/categories?month=${selectedMonth}`}
            className="mt-4 flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink-secondary transition-colors"
          >
            All categories
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
