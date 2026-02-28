"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MonthSelector from "@/components/ui/MonthSelector";
import Card from "@/components/ui/Card";
import Amount from "@/components/ui/Amount";
import EmptyState from "@/components/ui/EmptyState";
import DonutChart from "@/components/charts/DonutChart";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { getSpendByCategory } from "@/lib/queries";
import { CategorySpend } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_SLUGS } from "@/lib/constants";
import { usePrivacy } from "@/contexts/PrivacyContext";

export default function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = searchParams.get("month") || currentMonth;

  const [loading, setLoading] = useState(true);
  const [catSpend, setCatSpend] = useState<CategorySpend[]>([]);
  const { privacyMode } = usePrivacy();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cs = await getSpendByCategory([month]);
        setCatSpend(cs);
      } catch (e) {
        console.error("Failed to load categories:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [month]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height="h-72" />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  const total = catSpend.reduce((sum, c) => sum + c.total, 0);
  const hasData = total > 0;

  const handleSliceClick = (category: string) => {
    const slug = CATEGORY_SLUGS[category] || category.toLowerCase();
    router.push(`/categories/${slug}?month=${month}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Category Breakdown</h1>
        <MonthSelector />
      </div>

      {!hasData ? (
        <EmptyState message="No transactions found for this month." />
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-text-secondary">
                Spending by Category
              </h2>
              <Amount value={total} className="text-sm font-medium" />
            </div>
            <DonutChart data={catSpend} onSliceClick={handleSliceClick} />
          </Card>

          <Card>
            <h2 className="text-sm font-medium text-text-secondary mb-3">
              All Categories
            </h2>
            <div className="space-y-2">
              {catSpend.map((cat) => {
                const pct = total > 0 ? ((cat.total / total) * 100).toFixed(1) : "0";
                const slug = CATEGORY_SLUGS[cat.category] || cat.category.toLowerCase();
                return (
                  <button
                    key={cat.category}
                    onClick={() => router.push(`/categories/${slug}?month=${month}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg
                               hover:bg-bg-card-hover transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[cat.category] || "#6B7280",
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">{cat.category}</p>
                        <p className="text-xs text-text-secondary">
                          {cat.count} transaction{cat.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Amount
                        value={cat.total}
                        className="text-sm font-medium"
                      />
                      <p className="text-xs text-text-secondary">{pct}%</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
