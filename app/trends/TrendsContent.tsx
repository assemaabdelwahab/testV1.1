"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Amount from "@/components/ui/Amount";
import EmptyState from "@/components/ui/EmptyState";
import AreaChartComponent from "@/components/charts/AreaChartComponent";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { getLast12Months, formatPercent } from "@/lib/utils";
import { getSpendByMonth, getSpendByCategoryAndMonth } from "@/lib/queries";
import { MonthlySpend, MonthlyCategorySpend } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

export default function TrendsContent() {
  const [loading, setLoading] = useState(true);
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpend[]>([]);
  const [catMonthly, setCatMonthly] = useState<MonthlyCategorySpend[]>([]);
  const [stacked, setStacked] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);

  const months = getLast12Months();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [ms, cm] = await Promise.all([
          getSpendByMonth(months),
          getSpendByCategoryAndMonth(months),
        ]);
        setMonthlySpend(ms);
        setCatMonthly(cm);
      } catch (e) {
        console.error("Failed to load trends:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ChartSkeleton height="h-80" />
      </div>
    );
  }

  const currentMonth = months[months.length - 1];
  const prevMonth = months[months.length - 2];
  const currentTotal = monthlySpend.find((m) => m.year_month === currentMonth)?.total || 0;
  const prevTotal = monthlySpend.find((m) => m.year_month === prevMonth)?.total || 0;
  const monthChange = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

  const hasData = monthlySpend.length > 0;

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredCategories = selectedCategories.length > 0 ? selectedCategories : undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Spending Trends</h1>

      {!hasData ? (
        <EmptyState message="No transaction data available for trends." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs text-text-secondary mb-1">This Month</p>
              <Amount value={currentTotal} className="text-xl font-bold" />
            </Card>
            <Card>
              <p className="text-xs text-text-secondary mb-1">vs Last Month</p>
              <p
                className={`text-xl font-bold ${
                  monthChange >= 0 ? "text-accent-red" : "text-accent-green"
                }`}
              >
                {monthChange >= 0 ? "↑" : "↓"} {formatPercent(monthChange)}
              </p>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-text-secondary">
                Monthly Spend (Last 12 Months)
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-bg-primary text-text-secondary hover:text-text-primary transition-colors"
                >
                  Filter
                </button>
                <button
                  onClick={() => setStacked(!stacked)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-bg-primary text-text-secondary hover:text-text-primary transition-colors"
                >
                  {stacked ? "Stacked" : "Total"}
                </button>
              </div>
            </div>

            {showFilter && (
              <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-bg-primary rounded-lg">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      selectedCategories.includes(cat)
                        ? "bg-accent-blue text-white"
                        : "bg-bg-card text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-xs px-2 py-1 rounded bg-accent-red/20 text-accent-red"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {stacked ? (
              <AreaChartComponent
                data={catMonthly}
                months={months}
                stacked
                categories={filteredCategories}
              />
            ) : (
              <AreaChartComponent data={monthlySpend} months={months} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
