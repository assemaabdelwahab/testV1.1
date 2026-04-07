"use client";

import { useState, useCallback, useMemo } from "react";
import { useEffect } from "react";
import { getTransactionsByMonths, getBudgets } from "@/lib/queries";
import { Transaction, Budget } from "@/lib/types";
import { getLast6MonthsFrom, getLast12MonthsFrom } from "@/lib/utils";
import {
  getMonthlyTotals,
  computePaceHeadline,
  computeHeatmap,
  computeStreaks,
  computeMovers,
  computeMerchantLoyalty,
  computeAdvisor,
  computeChallenge,
} from "@/lib/insights";
import MonthNav from "@/components/ui/MonthNav";
import PaceHeadline from "@/components/sections/PaceHeadline";
import HeatmapCalendar from "@/components/sections/HeatmapCalendar";
import StreaksAndMovers from "@/components/sections/StreaksAndMovers";
import MerchantLoyalty from "@/components/sections/MerchantLoyalty";
import AdvisorCard from "@/components/sections/AdvisorCard";
import MonthlyChallenge from "@/components/sections/MonthlyChallenge";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function NarrativeSkeleton() {
  return (
    <div className="space-y-6 px-5 py-8 animate-pulse">
      <div className="h-8 w-48 bg-bg-elevated rounded" />
      <div className="h-5 w-64 bg-bg-elevated rounded" />
      <div className="h-40 w-full bg-bg-elevated rounded-card" />
      <div className="h-32 w-full bg-bg-elevated rounded-card" />
      <div className="h-48 w-full bg-bg-elevated rounded-card" />
    </div>
  );
}

export default function NarrativeContent() {
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // 12 months for data fetch (streak history needs full year)
  const months = useMemo(() => getLast12MonthsFrom(selectedMonth), [selectedMonth]);
  // 6 months for movers sparkline
  const last6Months = useMemo(() => getLast6MonthsFrom(selectedMonth), [selectedMonth]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [txns, buds] = await Promise.all([
          getTransactionsByMonths(months),
          getBudgets(),
        ]);
        setTransactions(txns);
        setBudgets(buds);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [months.join(",")]);

  // Correct a transaction in local state (from CategoryCorrection component)
  const handleCorrected = useCallback((txnId: string, newCategory: string) => {
    setTransactions((prev) => {
      const merchantName = prev.find((t) => t.id === txnId)?.merchant_name;
      return prev.map((t) =>
        t.id === txnId || (merchantName && t.merchant_name === merchantName)
          ? { ...t, category: newCategory, category_source: "manual" }
          : t
      );
    });
  }, []);

  const canGoNext = selectedMonth < currentMonth;

  const monthlyTotals = useMemo(() => getMonthlyTotals(transactions), [transactions]);

  const pace = useMemo(
    () => computePaceHeadline(selectedMonth, monthlyTotals),
    [selectedMonth, monthlyTotals]
  );
  const heatmap = useMemo(
    () => computeHeatmap(selectedMonth, transactions),
    [selectedMonth, transactions]
  );
  const streaks = useMemo(
    () => computeStreaks(monthlyTotals, budgets, selectedMonth),
    [monthlyTotals, budgets, selectedMonth]
  );
  const movers = useMemo(
    () => computeMovers(monthlyTotals, selectedMonth, last6Months),
    [monthlyTotals, selectedMonth, last6Months]
  );
  const merchants = useMemo(
    () => computeMerchantLoyalty(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const advisor = useMemo(
    () => computeAdvisor(monthlyTotals, selectedMonth),
    [monthlyTotals, selectedMonth]
  );
  const challenge = useMemo(
    () => computeChallenge(advisor, monthlyTotals, selectedMonth),
    [advisor, monthlyTotals, selectedMonth]
  );

  return (
    <div className="min-h-screen max-w-narrative mx-auto">
      <MonthNav
        selectedMonth={selectedMonth}
        onPrev={() => setSelectedMonth(prevMonth(selectedMonth))}
        onNext={() => setSelectedMonth(nextMonth(selectedMonth))}
        canGoNext={canGoNext}
      />

      {loading ? (
        <NarrativeSkeleton />
      ) : (
        <div className="space-y-10 pb-16">
          {/* 1. Pace Headline */}
          <PaceHeadline data={pace} selectedMonth={selectedMonth} />

          {/* 2. Heatmap Calendar */}
          {heatmap.length > 0 && (
            <HeatmapCalendar days={heatmap} selectedMonth={selectedMonth} />
          )}

          {/* 3. Streaks & Movers */}
          <StreaksAndMovers
            streaks={streaks}
            movers={movers}
            selectedMonth={selectedMonth}
          />

          {/* 4. Merchant Loyalty */}
          <MerchantLoyalty
            merchants={merchants}
            onTransactionCorrected={handleCorrected}
          />

          {/* 5. Advisor */}
          <AdvisorCard advisor={advisor} />

          {/* 6. Monthly Challenge */}
          {challenge && <MonthlyChallenge challenge={challenge} />}
        </div>
      )}
    </div>
  );
}
