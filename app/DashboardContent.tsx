"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import QuarterSelector from "@/components/ui/QuarterSelector";
import Card from "@/components/ui/Card";
import Amount from "@/components/ui/Amount";
import EmptyState from "@/components/ui/EmptyState";
import StackedBarChart from "@/components/charts/StackedBarChart";
import HeatmapTable from "@/components/charts/HeatmapTable";
import Sparkline from "@/components/charts/Sparkline";
import { CardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { getCurrentQuarterKey, getPrevQuarterKey, getQuarterInfo, formatPercent, getLast6Months } from "@/lib/utils";
import { getSpendByMonth, getSpendByCategoryAndMonth, getSpendByCategory } from "@/lib/queries";
import { MonthlyCategorySpend, MonthlySpend, CategorySpend } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { usePrivacy } from "@/contexts/PrivacyContext";

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const quarterKey = searchParams.get("q") || getCurrentQuarterKey();
  const info = getQuarterInfo(quarterKey);
  const prevInfo = getQuarterInfo(getPrevQuarterKey(quarterKey));

  const [loading, setLoading] = useState(true);
  const [monthlySpend, setMonthlySpend] = useState<MonthlySpend[]>([]);
  const [prevMonthlySpend, setPrevMonthlySpend] = useState<MonthlySpend[]>([]);
  const [catMonthly, setCatMonthly] = useState<MonthlyCategorySpend[]>([]);
  const [catSpend, setCatSpend] = useState<CategorySpend[]>([]);
  const [sparklineData, setSparklineData] = useState<Record<string, { value: number }[]>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const last6 = getLast6Months();
        const [ms, pms, cm, cs, sparkMs] = await Promise.all([
          getSpendByMonth(info.months),
          getSpendByMonth(prevInfo.months),
          getSpendByCategoryAndMonth(info.months),
          getSpendByCategory(info.months),
          getSpendByCategoryAndMonth(last6),
        ]);
        setMonthlySpend(ms);
        setPrevMonthlySpend(pms);
        setCatMonthly(cm);
        setCatSpend(cs);

        const sparklines: Record<string, { value: number }[]> = {};
        for (const cat of CATEGORIES) {
          sparklines[cat] = last6.map((m) => {
            const found = sparkMs.find(
              (d) => d.category === cat && d.year_month === m
            );
            return { value: found ? found.total : 0 };
          });
        }
        setSparklineData(sparklines);
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [quarterKey]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ChartSkeleton height="h-80" />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  const totalSpend = monthlySpend.reduce((sum, m) => sum + m.total, 0);
  const prevTotalSpend = prevMonthlySpend.reduce((sum, m) => sum + m.total, 0);
  const avgMonthly = monthlySpend.length > 0 ? totalSpend / monthlySpend.length : 0;
  const qChange = prevTotalSpend > 0 ? ((totalSpend - prevTotalSpend) / prevTotalSpend) * 100 : 0;
  const topCategory = catSpend.length > 0 ? catSpend[0] : null;

  const hasData = totalSpend > 0;
  const categories = catSpend.map((c) => c.category);

  return (
    <div className="space-y-6">
      <QuarterSelector />

      {!hasData ? (
        <EmptyState message="No transactions found for this quarter." />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <p className="text-xs text-text-secondary mb-1">Total Spend</p>
              <Amount value={totalSpend} className="text-xl font-bold" />
            </Card>
            <Card>
              <p className="text-xs text-text-secondary mb-1">Avg Monthly</p>
              <Amount value={avgMonthly} className="text-xl font-bold" />
            </Card>
            <Card>
              <p className="text-xs text-text-secondary mb-1">vs Prev Quarter</p>
              <p
                className={`text-xl font-bold ${
                  qChange >= 0 ? "text-accent-red" : "text-accent-green"
                }`}
              >
                {qChange >= 0 ? "↑" : "↓"} {formatPercent(qChange)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-text-secondary mb-1">Top Category</p>
              <p className="text-lg font-bold truncate">{topCategory?.category}</p>
              <Amount
                value={topCategory?.total || 0}
                className="text-xs text-text-secondary"
              />
            </Card>
          </div>

          {/* Stacked Bar Chart */}
          <Card>
            <h2 className="text-sm font-medium text-text-secondary mb-4">
              Monthly Comparison
            </h2>
            <StackedBarChart data={catMonthly} months={info.months} />
          </Card>

          {/* Heatmap Table */}
          <Card>
            <h2 className="text-sm font-medium text-text-secondary mb-4">
              Category Heatmap
            </h2>
            <HeatmapTable
              data={catMonthly}
              months={info.months}
              categories={categories}
            />
          </Card>

          {/* Trend Sparklines */}
          <Card>
            <h2 className="text-sm font-medium text-text-secondary mb-4">
              Category Trends (Last 6 Months)
            </h2>
            <div className="space-y-3">
              {catSpend.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-card-hover transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[cat.category] || "#6B7280",
                    }}
                  />
                  <span className="text-xs text-text-primary w-32 truncate">
                    {cat.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Sparkline
                      data={sparklineData[cat.category] || []}
                      color={CATEGORY_COLORS[cat.category] || "#6B7280"}
                    />
                  </div>
                  <Amount
                    value={cat.total}
                    className="text-xs text-text-secondary w-20 text-right"
                  />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
