"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { CATEGORY_COLORS } from "@/lib/constants";
import { MonthlyCategorySpend } from "@/lib/types";
import { formatCurrency, getMonthLabel } from "@/lib/utils";

interface StackedBarChartProps {
  data: MonthlyCategorySpend[];
  months: string[];
}

export default function StackedBarChart({
  data,
  months,
}: StackedBarChartProps) {
  const { privacyMode } = usePrivacy();

  const categories = [...new Set(data.map((d) => d.category))];

  const chartData = months.map((month) => {
    const row: Record<string, string | number> = {
      month: getMonthLabel(month),
    };
    for (const cat of categories) {
      const found = data.find(
        (d) => d.year_month === month && d.category === cat
      );
      row[cat] = found ? found.total : 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#94A3B8", fontSize: 12 }}
          axisLine={{ stroke: "#334155" }}
        />
        <YAxis
          tick={{ fill: "#94A3B8", fontSize: 12 }}
          axisLine={{ stroke: "#334155" }}
          tickFormatter={(v) => (privacyMode ? "•••" : `${(v / 1000).toFixed(0)}k`)}
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
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#94A3B8" }}
          iconSize={8}
        />
        {categories.map((cat) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="a"
            fill={CATEGORY_COLORS[cat] || "#6B7280"}
            radius={[0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
