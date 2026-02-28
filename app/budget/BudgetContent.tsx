"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import MonthSelector from "@/components/ui/MonthSelector";
import Card from "@/components/ui/Card";
import Amount from "@/components/ui/Amount";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBars from "@/components/charts/ProgressBars";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { getBudgetComparison } from "@/lib/queries";
import { BudgetComparison } from "@/lib/types";
import { usePrivacy } from "@/contexts/PrivacyContext";

export default function BudgetContent() {
  const searchParams = useSearchParams();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = searchParams.get("month") || currentMonth;

  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<BudgetComparison[]>([]);
  const { privacyMode } = usePrivacy();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getBudgetComparison(month);
        setComparison(data);
      } catch (e) {
        console.error("Failed to load budget data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [month]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <TableSkeleton rows={10} />
      </div>
    );
  }

  const totalBudget = comparison.reduce((sum, c) => sum + c.budgeted_amount, 0);
  const totalActual = comparison.reduce((sum, c) => sum + c.actual, 0);
  const totalPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  // Exclude investments from over/under calculation
  const expenseComparison = comparison.filter((c) => c.category !== "Investments");
  const expenseBudget = expenseComparison.reduce((sum, c) => sum + c.budgeted_amount, 0);
  const expenseActual = expenseComparison.reduce((sum, c) => sum + c.actual, 0);
  const overBudgetCount = expenseComparison.filter((c) => c.percentage > 100).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Budget vs Actual</h1>
        <MonthSelector />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-text-secondary mb-1">Total Budget</p>
          <Amount value={totalBudget} className="text-xl font-bold" />
        </Card>
        <Card>
          <p className="text-xs text-text-secondary mb-1">Total Spent</p>
          <Amount value={totalActual} className="text-xl font-bold" />
        </Card>
        <Card>
          <p className="text-xs text-text-secondary mb-1">
            Budget Used (excl. Investments)
          </p>
          <p
            className={`text-xl font-bold ${
              expenseActual > expenseBudget
                ? "text-accent-red"
                : "text-accent-green"
            }`}
          >
            {privacyMode
              ? "••••"
              : `${((expenseActual / expenseBudget) * 100).toFixed(0)}%`}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary mb-1">Over Budget</p>
          <p
            className={`text-xl font-bold ${
              overBudgetCount > 0 ? "text-accent-red" : "text-accent-green"
            }`}
          >
            {overBudgetCount} categor{overBudgetCount !== 1 ? "ies" : "y"}
          </p>
        </Card>
      </div>

      {comparison.length === 0 ? (
        <EmptyState message="No budget data available." />
      ) : (
        <Card>
          <h2 className="text-sm font-medium text-text-secondary mb-4">
            Category Budgets
          </h2>
          <ProgressBars data={comparison} />
        </Card>
      )}
    </div>
  );
}
