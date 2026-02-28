"use client";

import { usePrivacy } from "@/contexts/PrivacyContext";
import { formatCurrency } from "@/lib/utils";

interface AmountProps {
  value: number;
  className?: string;
  showSign?: boolean;
}

export default function Amount({ value, className = "", showSign }: AmountProps) {
  const { privacyMode } = usePrivacy();

  if (privacyMode) {
    return <span className={className}>••••••</span>;
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
