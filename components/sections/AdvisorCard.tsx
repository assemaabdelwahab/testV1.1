"use client";

import { useState } from "react";
import { AdvisorInsight } from "@/lib/insights";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { formatCurrency } from "@/lib/utils";

interface Props {
  advisor: AdvisorInsight;
}

export default function AdvisorCard({ advisor }: Props) {
  const { privacyMode } = usePrivacy();
  const [showProjectionTip, setShowProjectionTip] = useState(false);

  if (advisor.type === "no_data") {
    return (
      <div className="px-5 fade-up" style={{ animationDelay: "0.25s" }}>
        <p className="section-label mb-4">Advisor</p>
        <div className="card">
          <p className="text-sm text-ink-secondary">{advisor.headline}</p>
          <p className="text-xs text-ink-muted mt-1">{advisor.detail}</p>
        </div>
      </div>
    );
  }

  const isWarning = advisor.type === "warning";
  const accentColor = isWarning ? "#EF4444" : "#10B981";
  const bgClass = isWarning ? "bg-signal-red/5 border-signal-red/20" : "bg-signal-green/5 border-signal-green/20";
  const icon = isWarning ? "↑" : "↓";

  return (
    <div className="px-5 fade-up" style={{ animationDelay: "0.25s" }}>
      <p className="section-label mb-4">Advisor</p>
      <div className={`card border ${bgClass} space-y-4`}>
        <div>
          <div className="flex items-start gap-2">
            <span className="text-lg leading-none mt-0.5" style={{ color: accentColor }}>{icon}</span>
            <div>
              <p className="text-base font-bold text-ink-primary leading-snug">{advisor.headline}</p>
              <p className="text-xs text-ink-secondary mt-1">{advisor.detail}</p>
            </div>
          </div>
        </div>

        {!privacyMode && advisor.projectedMonthly > 0 && (
          <div className="pt-3 border-t border-bg-elevated space-y-2">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="text-ink-secondary">Projected this month</span>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowProjectionTip(true)}
                    onMouseLeave={() => setShowProjectionTip(false)}
                    onTouchStart={() => setShowProjectionTip((v) => !v)}
                    className="text-ink-muted hover:text-ink-secondary transition-colors leading-none"
                    aria-label="How is this calculated?"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showProjectionTip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 bg-bg-card border border-border-subtle rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-[10px] text-ink-secondary leading-relaxed">
                        Spend so far ÷ days elapsed × days in month. Less accurate early in the month.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <span className="num font-semibold text-ink-primary">{formatCurrency(advisor.projectedMonthly)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink-secondary">Annualized run rate</span>
              <span className="num font-semibold" style={{ color: accentColor }}>
                {formatCurrency(advisor.projectedAnnual)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
