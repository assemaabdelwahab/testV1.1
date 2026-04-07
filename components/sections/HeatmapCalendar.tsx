"use client";

import { useState } from "react";
import { HeatmapDay } from "@/lib/insights";
import { formatCurrency } from "@/lib/utils";
import { usePrivacy } from "@/contexts/PrivacyContext";

interface Props {
  days: HeatmapDay[];
  selectedMonth: string;
}

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// Inline colors — bypasses CSS class purging
const HM_COLORS = ["#1C1C24", "#166534", "#15803D", "#16A34A", "#22C55E", "#4ADE80"];

function getWeekdayOffset(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  return (d.getDay() + 6) % 7;
}

function bgStyle(day: HeatmapDay | null): React.CSSProperties {
  if (!day || day.isFuture) return { backgroundColor: "transparent", border: "1px solid #1C1C24" };
  return { backgroundColor: HM_COLORS[day.intensity] };
}

function outlineStyle(isToday: boolean, isSelected: boolean): React.CSSProperties {
  if (isSelected) return { outline: "2px solid #22C55E", outlineOffset: "2px" };
  if (isToday) return { outline: "1px solid rgba(240,240,245,0.4)", outlineOffset: "2px" };
  return {};
}

export default function HeatmapCalendar({ days, selectedMonth }: Props) {
  const { privacyMode } = usePrivacy();
  const [tooltip, setTooltip] = useState<HeatmapDay | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (days.length === 0) return null;

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonth = todayStr.slice(0, 7);

  // ── Collapsed: 7-day strip ──────────────────────────────────────────────────
  // Current month → Mon–Sun of current week. Past months → last 7 days.
  let weekDays: HeatmapDay[];
  if (selectedMonth === currentMonth) {
    const todayWeekday = (new Date(todayStr + "T00:00:00").getDay() + 6) % 7; // 0=Mon
    const weekStart = new Date(todayStr + "T00:00:00");
    weekStart.setDate(weekStart.getDate() - todayWeekday);
    weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      return days.find((x) => x.date === dateStr) ?? {
        date: dateStr,
        total: 0,
        transactions: 0,
        topMerchants: [],
        intensity: 0,
        isFuture: dateStr > todayStr,
      };
    });
  } else {
    weekDays = days.slice(-7);
  }

  // ── Expanded: full month grid ───────────────────────────────────────────────
  const offset = getWeekdayOffset(days[0].date);
  const expandedCells: (HeatmapDay | null)[] = [
    ...Array(offset).fill(null),
    ...days,
  ];

  const DayTooltip = () =>
    tooltip ? (
      <div className="mt-4 card text-sm">
        <div className="flex justify-between items-center">
          <span className="text-ink-secondary text-xs">
            {new Date(tooltip.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="num font-semibold text-ink-primary">
            {privacyMode ? "••••" : formatCurrency(tooltip.total)}
          </span>
        </div>
        {!privacyMode && tooltip.topMerchants.length > 0 && (
          <p className="text-ink-secondary text-xs mt-1.5">
            {tooltip.topMerchants.join(" · ")}
          </p>
        )}
      </div>
    ) : null;

  return (
    <div className="px-5 fade-up" style={{ animationDelay: "0.1s" }}>
      <p className="section-label mb-4">Daily Spend</p>

      {isExpanded ? (
        <>
          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[9px] font-medium" style={{ color: "#6B7080" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Full month grid */}
          <div className="grid grid-cols-7 gap-1">
            {expandedCells.map((day, i) => {
              const isToday = !!day && day.date === todayStr;
              const isSelected = !!day && tooltip?.date === day.date;
              return (
                <button
                  key={i}
                  className="aspect-square w-full cursor-default rounded-sm transition-opacity"
                  style={{
                    ...bgStyle(day),
                    ...outlineStyle(isToday, isSelected),
                    minHeight: 28,
                    visibility: day === null ? "hidden" : "visible",
                  }}
                  onMouseEnter={() => day && !day.isFuture && day.total > 0 && setTooltip(day)}
                  onMouseLeave={() => setTooltip(null)}
                  onTouchStart={() => day && !day.isFuture && day.total > 0 && setTooltip((prev) => (prev?.date === day.date ? null : day))}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-[9px]" style={{ color: "#6B7080" }}>Less</span>
            {HM_COLORS.map((color, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            ))}
            <span className="text-[9px]" style={{ color: "#6B7080" }}>More</span>
          </div>
        </>
      ) : (
        <>
          {/* Week strip — 7 days */}
          <div className="flex gap-1.5">
            {weekDays.map((day) => {
              const isToday = day.date === todayStr;
              const isSelected = tooltip?.date === day.date;
              const dayNum = parseInt(day.date.split("-")[2], 10);
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                  <button
                    className="w-full aspect-square rounded-sm cursor-default transition-opacity"
                    style={{
                      ...bgStyle(day),
                      ...outlineStyle(isToday, isSelected),
                    }}
                    onMouseEnter={() => !day.isFuture && day.total > 0 && setTooltip(day)}
                    onMouseLeave={() => setTooltip(null)}
                    onTouchStart={() => !day.isFuture && day.total > 0 && setTooltip((prev) => (prev?.date === day.date ? null : day))}
                  />
                  <span
                    className={`text-[9px] num ${isToday ? "font-medium" : ""}`}
                    style={{ color: isToday ? "#F0F0F5" : "#6B7080" }}
                  >
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      <DayTooltip />

      {/* Toggle */}
      <button
        onClick={() => {
          setIsExpanded((e) => !e);
          setTooltip(null);
        }}
        className="mt-3 text-[10px] hover:text-ink-secondary transition-colors flex items-center gap-1"
        style={{ color: "#6B7080" }}
      >
        {isExpanded ? (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            Collapse
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Show full month
          </>
        )}
      </button>
    </div>
  );
}
