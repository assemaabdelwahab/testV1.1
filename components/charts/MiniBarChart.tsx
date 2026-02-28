"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { MonthlySpend } from "@/lib/types";
import { formatCurrency, getMonthLabel } from "@/lib/utils";

interface MiniBarChartProps {
  data: MonthlySpend[];
  color?: string;
}

export default function MiniBarChart({
  data,
  color = "#3B82F6",
}: MiniBarChartProps) {
  const { privacyMode } = usePrivacy();

  const chartData = data.map((d) => ({
    month: getMonthLabel(d.year_month).split(" ")[0],
    total: d.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#94A3B8", fontSize: 11 }}
          axisLine={{ stroke: "#334155" }}
        />
        <YAxis
          tick={{ fill: "#94A3B8", fontSize: 11 }}
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
            "Spend",
          ]}
        />
        <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
