"use client";

import { usePrivacy } from "@/contexts/PrivacyContext";
import { formatCurrency, formatFxAmount } from "@/lib/utils";

interface AmountProps {
  value: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
}

export default function Amount({ value, currency, className = "", showSign }: AmountProps) {
  const { privacyMode } = usePrivacy();

  if (privacyMode) {
    return <span className={className}>••••••</span>;
  }

  if (currency && currency !== "EGP") {
    return (
      <span className={className}>
        <span className="text-xs font-medium text-yellow-500 mr-1">{currency}</span>
        {formatFxAmount(Math.abs(value), currency).replace(`${currency} `, "")}
      </span>
    );
  }

  const formatted = formatCurrency(Math.abs(value));
  const sign = showSign ? (value >= 0 ? "+" : "-") : value < 0 ? "-" : "";

  return (
    <span className={className}>
      {sign}
      {formatted}
    </span>
  );
}
