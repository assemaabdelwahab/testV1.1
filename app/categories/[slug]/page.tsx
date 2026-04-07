"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getTransactionsByCategory } from "@/lib/queries";
import { Transaction } from "@/lib/types";
import { SLUG_TO_CATEGORY, CATEGORY_COLORS } from "@/lib/constants";
import { toEGP, formatCurrency, getMonthLabel } from "@/lib/utils";
import { usePrivacy } from "@/contexts/PrivacyContext";
import CategoryCorrection from "@/components/ui/CategoryCorrection";
import Amount from "@/components/ui/Amount";

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

function CategoryDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { privacyMode } = usePrivacy();

  const slug = params.slug as string;
  const currentMonth = getCurrentMonth();
  const selectedMonth = searchParams.get("month") || currentMonth;

  const category = SLUG_TO_CATEGORY[slug] || slug;
  const color = CATEGORY_COLORS[category] || "#A1A1AA";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTransactionsByCategory(category, selectedMonth)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [category, selectedMonth]);

  const handleCorrected = useCallback((txnId: string, newCategory: string) => {
    setTransactions((prev) => {
      const merchantName = prev.find((t) => t.id === txnId)?.merchant_name;
      return prev
        .map((t) =>
          t.id === txnId || (merchantName && t.merchant_name === merchantName)
            ? { ...t, category: newCategory, category_source: "manual" }
            : t
        )
        .filter((t) => t.category === category);
    });
  }, [category]);

  const total = transactions.reduce((sum, t) => sum + toEGP(Number(t.amount), t.currency), 0);
  const canGoNext = selectedMonth < currentMonth;

  return (
    <div className="min-h-screen max-w-narrative mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-5">
        <Link
          href={`/categories?month=${selectedMonth}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
          title="All categories"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/categories/${slug}?month=${prevMonthOf(selectedMonth)}`)}
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
              onClick={() => router.push(`/categories/${slug}?month=${nextMonthOf(selectedMonth)}`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        <div className="w-8" />
      </div>

      <div className="px-5 pb-16">
        {/* Category header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <h1 className="text-2xl font-bold text-ink-primary">{category}</h1>
        </div>
        {!loading && (
          <p className="text-sm text-ink-secondary mb-6 ml-5">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            {!privacyMode && transactions.length > 0 && (
              <span className="ml-2 num font-semibold text-ink-primary">{formatCurrency(total)}</span>
            )}
          </p>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-bg-elevated rounded-card" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-ink-secondary">
            No {category} transactions in {getMonthLabel(selectedMonth)}.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="card flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary truncate">
                    {t.merchant_name || "—"}
                  </p>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    {new Date(t.transaction_date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <CategoryCorrection transaction={t} onCorrected={handleCorrected} />
                <Amount
                  value={Number(t.amount)}
                  currency={t.currency}
                  className="num text-sm font-semibold text-ink-primary flex-shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryDetailPage() {
  return (
    <Suspense>
      <CategoryDetailContent />
    </Suspense>
  );
}
