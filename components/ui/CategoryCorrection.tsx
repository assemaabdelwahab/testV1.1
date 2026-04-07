"use client";

import { useEffect, useRef, useState } from "react";
import { Transaction } from "@/lib/types";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";

interface Props {
  transaction: Transaction;
  onCorrected: (txnId: string, newCategory: string) => void;
}

export default function CategoryCorrection({ transaction, onCorrected }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Disable correction for transactions with no merchant (can't create a rule)
  if (!transaction.merchant_name) return null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSelect(newCategory: string) {
    if (newCategory === transaction.category) {
      setOpen(false);
      return;
    }
    setSaving(true);
    setOpen(false);
    try {
      await Promise.all([
        fetch(`/api/transactions/${transaction.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: newCategory }),
        }),
        fetch("/api/corrections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_pattern: transaction.merchant_name,
            correct_category: newCategory,
            match_type: "exact",
          }),
        }),
      ]);
      onCorrected(transaction.id, newCategory);
      setToast(`All "${transaction.merchant_name}" transactions → ${newCategory}`);
      setTimeout(() => setToast(null), 3500);
    } catch {
      setToast("Failed to save correction");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  const color = CATEGORY_COLORS[transaction.category] || "#A1A1AA";

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Category chip */}
      <button
        onClick={() => !saving && setOpen((o) => !o)}
        disabled={saving}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                   bg-bg-card border border-border-subtle hover:border-border-default
                   transition-colors cursor-pointer disabled:opacity-50"
        title="Tap to correct category"
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-text-secondary">{saving ? "Saving…" : transaction.category}</span>
        <svg className="w-2.5 h-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-52
                        bg-bg-card border border-border-default rounded-lg shadow-lg
                        py-1 max-h-64 overflow-y-auto">
          {CATEGORIES.map((cat) => {
            const catColor = CATEGORY_COLORS[cat] || "#A1A1AA";
            const active = cat === transaction.category;
            return (
              <button
                key={cat}
                onClick={() => handleSelect(cat)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left
                            hover:bg-bg-card-hover transition-colors
                            ${active ? "text-text-primary font-medium" : "text-text-secondary"}`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: catColor }}
                />
                {cat}
                {active && (
                  <svg className="w-3 h-3 ml-auto text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                        bg-bg-card border border-border-default rounded-lg
                        px-4 py-2.5 text-xs text-text-primary shadow-lg
                        max-w-xs text-center pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
