"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { GAME_LABELS } from "@/shared/types";
import type { GameBreakdown } from "../types";

const COLORS = [
  "hsl(280, 100%, 60%)", // purple — primary
  "hsl(200, 100%, 50%)", // blue — secondary
  "hsl(330, 100%, 60%)", // pink — destructive
  "hsl(45, 100%, 50%)",  // gold — accent
];

interface GameBreakdownChartProps {
  data: GameBreakdown[];
  mode: "value" | "count";
}

export function GameBreakdownChart({ data, mode }: GameBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No collection data yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: GAME_LABELS[d.gameType as keyof typeof GAME_LABELS] ?? d.gameType,
    value: mode === "value" ? Math.round(d.totalValue * 100) / 100 : d.cardCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          strokeWidth={0}
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "13px",
          }}
          formatter={(value: number | undefined) =>
            value != null
              ? mode === "value" ? `$${value.toFixed(2)}` : `${value} cards`
              : ""
          }
        />
        <Legend
          wrapperStyle={{ fontSize: "13px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
