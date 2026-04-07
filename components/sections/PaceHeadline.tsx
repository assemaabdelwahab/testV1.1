"use client";

import { PaceHeadline as PaceData } from "@/lib/insights";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { formatCurrency } from "@/lib/utils";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

interface Props {
  data: PaceData;
  selectedMonth: string;
}

export default function PaceHeadline({ data, selectedMonth }: Props) {
  const { privacyMode } = usePrivacy();
  const [year, month] = selectedMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  if (data.noData) {
    return (
      <div className="px-5 py-8 fade-up">
        <p className="text-4xl font-black text-ink-primary leading-none">Your first month!</p>
        <p className="text-ink-secondary mt-3 text-sm">No comparison data yet — keep tracking.</p>
      </div>
    );
  }

  if (data.isCurrentMonth) {
    const pacingColor =
      data.pacing === "under" ? "text-signal-green" :
      data.pacing === "over" ? "text-signal-red" : "text-signal-amber";
    const pacingWord =
      data.pacing === "under" ? "Pacing under." :
      data.pacing === "over" ? "Pacing over." : "On pace.";

    return (
      <div className="px-5 py-8 fade-up space-y-3">
        <p className="text-xs text-ink-secondary font-medium tracking-widest uppercase">
          Day {data.dayOfMonth} of {data.daysInMonth}
        </p>
        <div>
          <span className="text-4xl font-black text-ink-primary leading-none num">
            {privacyMode ? "••••••" : formatCurrency(data.totalSpend)}
          </span>
          <span className="text-ink-secondary text-sm ml-2">spent so far</span>
        </div>
        <p className="text-ink-secondary text-sm leading-relaxed">
          {privacyMode
            ? `At ••% of ${monthLabel(prevMonth)}'s total. `
            : `At ${Math.round(data.pacePercentage)}% of ${monthLabel(prevMonth)}'s total. `}
          <span className={pacingColor + " font-medium"}>{pacingWord}</span>
        </p>
        {!privacyMode && data.projectedTotal > 0 && data.dayOfMonth >= 5 && (
          <p className="text-ink-secondary text-xs">
            Projected: <span className="text-ink-primary num font-semibold">{formatCurrency(data.projectedTotal)}</span>
          </p>
        )}
      </div>
    );
  }

  // Completed month
  const diff = data.totalSpend - data.previousMonthTotal;
  const lighter = data.totalSpend < data.previousMonthTotal;
  const diffWord = lighter ? "lighter" : "heavier";
  const diffColor = lighter ? "text-signal-green" : "text-signal-red";

  return (
    <div className="px-5 py-8 fade-up space-y-3">
      <p className="text-xs text-ink-secondary font-medium tracking-widest uppercase">
        {monthLabel(selectedMonth)}
      </p>
      <div>
        <span className="text-4xl font-black text-ink-primary leading-none num">
          {privacyMode ? "••••••" : formatCurrency(data.totalSpend)}
        </span>
        <span className="text-ink-secondary text-sm ml-2">total</span>
      </div>
      <p className="text-ink-secondary text-sm leading-relaxed">
        A <span className={diffColor + " font-medium"}>{diffWord}</span> month.{" "}
        {data.categoriesImproved > 0 && `${data.categoriesImproved} categories improved`}
        {data.categoriesImproved > 0 && data.categoriesWorsened > 0 && ", "}
        {data.categoriesWorsened > 0 && `${data.categoriesWorsened} need attention`}
        {data.categoriesImproved === 0 && data.categoriesWorsened === 0 && "Steady month."}
        .
      </p>
      {!privacyMode && data.previousMonthTotal > 0 && (
        <p className="text-ink-secondary text-xs">
          vs {monthLabel(prevMonth)}:{" "}
          <span className={diffColor + " font-semibold num"}>
            {diff >= 0 ? "+" : ""}{formatCurrency(Math.abs(diff))}
          </span>
        </p>
      )}
    </div>
  );
}
