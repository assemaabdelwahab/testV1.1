"use client";

import { usePrivacy } from "@/contexts/PrivacyContext";

interface MonthNavProps {
  selectedMonth: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MonthNav({ selectedMonth, onPrev, onNext, canGoNext }: MonthNavProps) {
  const { privacyMode, togglePrivacy } = usePrivacy();
  const [year, month] = selectedMonth.split("-").map(Number);
  const label = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="flex items-center justify-between py-4 px-5">
      <button
        onClick={onPrev}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="font-sans font-medium text-ink-primary text-sm tracking-wide">
        {label}
      </span>

      <div className="flex items-center gap-2">
        {canGoNext && (
          <button
            onClick={onNext}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <button
          onClick={togglePrivacy}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-bg-elevated transition-colors"
          title={privacyMode ? "Show amounts" : "Hide amounts"}
        >
          {privacyMode ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
