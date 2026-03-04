"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { RarityBreakdown } from "../types";

const RARITY_LABELS: Record<string, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  SUPER_RARE: "Super Rare",
  ULTRA_RARE: "Ultra Rare",
  SECRET_RARE: "Secret Rare",
  SPECIAL: "Special",
  Unknown: "Unknown",
};

interface RarityChartProps {
  data: RarityBreakdown[];
}

export function RarityChart({ data }: RarityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No cards yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    rarity: RARITY_LABELS[d.rarity] ?? d.rarity,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="rarity"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        />
        <Bar
          dataKey="count"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
