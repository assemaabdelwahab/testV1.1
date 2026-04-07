"use client";

import { useState } from "react";
import { MerchantLoyalty as MerchantData } from "@/lib/insights";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import Amount from "@/components/ui/Amount";
import CategoryCorrection from "@/components/ui/CategoryCorrection";
import { Transaction } from "@/lib/types";

interface Props {
  merchants: MerchantData[];
  onTransactionCorrected: (txnId: string, newCategory: string) => void;
}

export default function MerchantLoyalty({ merchants, onTransactionCorrected }: Props) {
  const { privacyMode } = usePrivacy();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (merchants.length === 0) return null;

  return (
    <div className="px-5 fade-up" style={{ animationDelay: "0.2s" }}>
      <p className="section-label mb-4">Top Merchants</p>
      <div className="space-y-2">
        {merchants.map((m, rank) => {
          const isExpanded = expanded === m.merchantName;
          const color = CATEGORY_COLORS[m.category] || "#6B7080";
          return (
            <div key={m.merchantName} className="card overflow-hidden">
              <button
                className="w-full flex items-center gap-3 text-left"
                onClick={() => setExpanded(isExpanded ? null : m.merchantName)}
              >
                <span className="text-xs text-ink-muted font-mono w-4 flex-shrink-0">
                  {rank + 1}
                </span>
                <div
                  className="w-1.5 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary truncate">
                    {privacyMode ? "Merchant •••" : m.merchantName}
                  </p>
                  <p className="text-xs text-ink-secondary">
                    {m.visitCount} visit{m.visitCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold num text-ink-primary">
                    {privacyMode ? "••••" : formatCurrency(m.totalSpend)}
                  </p>
                </div>
                <svg
                  className={`w-3 h-3 text-ink-muted transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-bg-elevated space-y-2">
                  {m.transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center gap-2 text-xs text-ink-secondary">
                      <span className="flex-shrink-0">
                        {new Date(txn.transaction_date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric"
                        })}
                      </span>
                      <span className="flex-1 truncate">{txn.category}</span>
                      <CategoryCorrection transaction={txn} onCorrected={onTransactionCorrected} />
                      <Amount
                        value={Number(txn.amount)}
                        currency={txn.currency}
                        className="flex-shrink-0 num font-medium text-ink-primary"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
