"use client";

import { MonthlyChallenge as ChallengeData } from "@/lib/insights";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { formatCurrency } from "@/lib/utils";

interface Props {
  challenge: ChallengeData;
}

export default function MonthlyChallenge({ challenge }: Props) {
  const { privacyMode } = usePrivacy();

  const { status, progress, label, currentSpend, targetAmount } = challenge;

  const statusConfig = {
    succeeded: { label: "Challenge complete", color: "#10B981", barColor: "#10B981" },
    on_track: { label: "On track", color: "#10B981", barColor: "#10B981" },
    in_progress: { label: "In progress", color: "#6B7080", barColor: "#3B82F6" },
    at_risk: { label: "At risk", color: "#F59E0B", barColor: "#F59E0B" },
    failed: { label: "Over target", color: "#EF4444", barColor: "#EF4444" },
  };

  const cfg = statusConfig[status];
  const clampedProgress = Math.min(progress, 100);

  return (
    <div className="px-5 pb-10 fade-up" style={{ animationDelay: "0.3s" }}>
      <p className="section-label mb-4">Monthly Challenge</p>
      <div className="card space-y-4">
        <p className="text-sm font-medium text-ink-primary leading-snug">{label}</p>

        {/* Progress bar */}
        <div>
          <div className="progress-track">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${clampedProgress}%`,
                backgroundColor: cfg.barColor,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-ink-secondary">
              {privacyMode ? "•••" : formatCurrency(currentSpend)} spent
            </span>
            <span className="text-ink-secondary">
              {privacyMode ? "•••" : formatCurrency(targetAmount)} target
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
          {!privacyMode && (
            <span className="text-xs text-ink-secondary ml-auto num">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
