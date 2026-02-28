"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getMonthLabel } from "@/lib/utils";

interface MonthSelectorProps {
  paramName?: string;
}

export default function MonthSelector({ paramName = "month" }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = searchParams.get(paramName) || currentMonth;

  const navigate = (direction: -1 | 1) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, newMonth);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   hover:bg-bg-card-hover text-text-secondary hover:text-text-primary
                   transition-colors"
        aria-label="Previous month"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-sm font-medium text-text-primary min-w-[100px] text-center">
        {getMonthLabel(selectedMonth)}
      </span>
      <button
        onClick={() => navigate(1)}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   hover:bg-bg-card-hover text-text-secondary hover:text-text-primary
                   transition-colors"
        aria-label="Next month"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
