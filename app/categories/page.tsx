"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getTransactionsByMonths } from "@/lib/queries";
import { Transaction } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_SLUGS } from "@/lib/constants";
import { toEGP, formatCurrency, getMonthLabel } from "@/lib/utils";
import { usePrivacy } from "@/contexts/PrivacyContext";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonthOf(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonthOf(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function CategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { privacyMode } = usePrivacy();

  const currentMonth = getCurrentMonth();
  const selectedMonth = searchParams.get("month") || currentMonth;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTransactionsByMonths([selectedMonth])
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of transactions) {
      const egp = toEGP(Number(t.amount), t.currency);
      const existing = map.get(t.category) || { total: 0, count: 0 };
      existing.total += egp;
      existing.count += 1;
      map.set(t.category, existing);
    }
    return Array.from(map.entries())
      .map(([category, { total, count }]) => ({ category, total, count }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const canGoNext = selectedMonth < currentMonth;

  return (
    <div className="min-h-screen max-w-narrative mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-5">
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
          title="Back to dashboard"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/categories?month=${prevMonthOf(selectedMonth)}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-sans font-medium text-ink-primary text-sm tracking-wide w-20 text-center">
            {getMonthLabel(selectedMonth)}
          </span>
          {canGoNext && (
            <button
              onClick={() => router.push(`/categories?month=${nextMonthOf(selectedMonth)}`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Spacer to balance the back button */}
        <div className="w-8" />
      </div>

      <div className="px-5 pb-16">
        <p className="section-label mb-4">Spending by Category</p>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-bg-elevated rounded-card" />
            ))}
          </div>
        ) : categoryTotals.length === 0 ? (
          <p className="text-sm text-ink-secondary">No transactions for {getMonthLabel(selectedMonth)}.</p>
        ) : (
          <div className="space-y-2">
            {categoryTotals.map(({ category, total, count }) => {
              const slug = CATEGORY_SLUGS[category] || category.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={category}
                  href={`/categories/${slug}?month=${selectedMonth}`}
                  className="card flex items-center gap-3 hover:bg-bg-elevated/50 active:bg-bg-elevated transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[category] || "#A1A1AA" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-primary">{category}</p>
                    <p className="text-xs text-ink-secondary">
                      {count} transaction{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="num text-sm font-semibold text-ink-primary flex-shrink-0">
                    {privacyMode ? "••••" : formatCurrency(total)}
                  </span>
                  <svg className="w-4 h-4 text-ink-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense>
      <CategoriesContent />
    </Suspense>
  );
}
