"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  getCurrentQuarterKey,
  getPrevQuarterKey,
  getNextQuarterKey,
  getQuarterInfo,
} from "@/lib/utils";

export default function QuarterSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quarterKey = searchParams.get("q") || getCurrentQuarterKey();
  const info = getQuarterInfo(quarterKey);

  const navigate = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", key);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(getPrevQuarterKey(quarterKey))}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   hover:bg-bg-card-hover text-text-secondary hover:text-text-primary
                   transition-colors"
        aria-label="Previous quarter"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-sm font-medium text-text-primary min-w-[160px] text-center">
        {info.label}
      </span>
      <button
        onClick={() => navigate(getNextQuarterKey(quarterKey))}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   hover:bg-bg-card-hover text-text-secondary hover:text-text-primary
                   transition-colors"
        aria-label="Next quarter"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
