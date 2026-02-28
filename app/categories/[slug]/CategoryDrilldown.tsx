"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Amount from "@/components/ui/Amount";
import EmptyState from "@/components/ui/EmptyState";
import MonthSelector from "@/components/ui/MonthSelector";
import MiniBarChart from "@/components/charts/MiniBarChart";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { getMerchantGroups, getCategorySpendHistory } from "@/lib/queries";
import { MerchantGroup, MonthlySpend } from "@/lib/types";
import { SLUG_TO_CATEGORY, CATEGORY_COLORS } from "@/lib/constants";
import { getLast6Months } from "@/lib/utils";
import { usePrivacy } from "@/contexts/PrivacyContext";

export default function CategoryDrilldown() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const category = SLUG_TO_CATEGORY[slug] || slug;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = searchParams.get("month") || currentMonth;

  const [loading, setLoading] = useState(true);
  const [merchantGroups, setMerchantGroups] = useState<MerchantGroup[]>([]);
  const [history, setHistory] = useState<MonthlySpend[]>([]);
  const { privacyMode } = usePrivacy();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const last6 = getLast6Months();
        const [mg, hist] = await Promise.all([
          getMerchantGroups(category, month),
          getCategorySpendHistory(category, last6),
        ]);
        setMerchantGroups(mg);
        setHistory(hist);
      } catch (e) {
        console.error("Failed to load category detail:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, month]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height="h-48" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const total = merchantGroups.reduce((sum, g) => sum + g.total, 0);
  const color = CATEGORY_COLORS[category] || "#3B82F6";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/categories?month=${month}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       hover:bg-bg-card-hover text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              {category}
            </h1>
            <Amount
              value={total}
              className="text-sm text-text-secondary"
            />
          </div>
        </div>
        <MonthSelector />
      </div>

      {merchantGroups.length === 0 ? (
        <EmptyState message={`No ${category} transactions this month.`} />
      ) : (
        <>
          <Card>
            <h2 className="text-sm font-medium text-text-secondary mb-3">
              Last 6 Months
            </h2>
            <MiniBarChart data={history} color={color} />
          </Card>

          <Card>
            <h2 className="text-sm font-medium text-text-secondary mb-3">
              By Merchant
            </h2>
            <div className="space-y-4">
              {merchantGroups.map((group) => (
                <div key={group.merchant_name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {group.merchant_name}
                    </span>
                    <div className="text-right">
                      <Amount
                        value={group.total}
                        className="text-sm font-medium"
                      />
                      <p className="text-xs text-text-secondary">
                        {group.count} txn{group.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="pl-4 space-y-1">
                    {group.transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between text-xs text-text-secondary py-1"
                      >
                        <span>{new Date(txn.transaction_date).toLocaleDateString()}</span>
                        <Amount
                          value={Number(txn.amount)}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
