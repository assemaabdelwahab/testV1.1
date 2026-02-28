"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { CategorySpend } from "@/lib/types";

interface DonutChartProps {
  data: CategorySpend[];
  onSliceClick?: (category: string) => void;
}

export default function DonutChart({ data, onSliceClick }: DonutChartProps) {
  const { privacyMode } = usePrivacy();
  const total = data.reduce((sum, d) => sum + d.total, 0);

  const chartData = data.map((d) => ({
    name: d.category,
    value: d.total,
    percentage: total > 0 ? ((d.total / total) * 100).toFixed(1) : "0",
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          onClick={(entry) => onSliceClick?.(entry.name)}
          className="cursor-pointer"
        >
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={CATEGORY_COLORS[entry.name] || "#6B7280"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E293B",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#F8FAFC",
          }}
          formatter={(value, name) => {
            const v = Number(value);
            const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
            return [
              privacyMode ? `${pct}%` : `${formatCurrency(v)} (${pct}%)`,
              name,
            ];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
