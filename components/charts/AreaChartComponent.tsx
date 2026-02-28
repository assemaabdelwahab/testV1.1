"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { CATEGORY_COLORS } from "@/lib/constants";
import { MonthlyCategorySpend, MonthlySpend } from "@/lib/types";
import { formatCurrency, getMonthLabel } from "@/lib/utils";

interface AreaChartProps {
  data: MonthlyCategorySpend[] | MonthlySpend[];
  months: string[];
  stacked?: boolean;
  categories?: string[];
}

export default function AreaChartComponent({
  data,
  months,
  stacked = false,
  categories: filterCategories,
}: AreaChartProps) {
  const { privacyMode } = usePrivacy();

  if (!stacked || !("category" in (data[0] || {}))) {
    const simpleData = months.map((month) => {
      const found = (data as MonthlySpend[]).find(
        (d) => d.year_month === month
      );
      return {
        month: getMonthLabel(month),
        total: found ? found.total : 0,
      };
    });

    return (
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={simpleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94A3B8", fontSize: 12 }}
            axisLine={{ stroke: "#334155" }}
          />
          <YAxis
            tick={{ fill: "#94A3B8", fontSize: 12 }}
            axisLine={{ stroke: "#334155" }}
            tickFormatter={(v) =>
              privacyMode ? "•••" : `${(v / 1000).toFixed(0)}k`
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#F8FAFC",
            }}
            formatter={(value) => [
              privacyMode ? "••••••" : formatCurrency(Number(value)),
              "Total",
            ]}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  const catData = data as MonthlyCategorySpend[];
  const allCategories = filterCategories || [
    ...new Set(catData.map((d) => d.category)),
  ];

  const chartData = months.map((month) => {
    const row: Record<string, string | number> = {
      month: getMonthLabel(month),
    };
    for (const cat of allCategories) {
      const found = catData.find(
        (d) => d.year_month === month && d.category === cat
      );
      row[cat] = found ? found.total : 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#94A3B8", fontSize: 12 }}
          axisLine={{ stroke: "#334155" }}
        />
        <YAxis
          tick={{ fill: "#94A3B8", fontSize: 12 }}
          axisLine={{ stroke: "#334155" }}
          tickFormatter={(v) =>
            privacyMode ? "•••" : `${(v / 1000).toFixed(0)}k`
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#F8FAFC",
          }}
          formatter={(value, name) => [
            privacyMode ? "••••••" : formatCurrency(Number(value)),
            name,
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#94A3B8" }} iconSize={8} />
        {allCategories.map((cat) => (
          <Area
            key={cat}
            type="monotone"
            dataKey={cat}
            stackId={stacked ? "1" : undefined}
            stroke={CATEGORY_COLORS[cat] || "#6B7280"}
            fill={CATEGORY_COLORS[cat] || "#6B7280"}
            fillOpacity={0.3}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
