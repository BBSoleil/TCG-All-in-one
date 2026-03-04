"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { PriceHistoryPoint } from "../services/price-history";

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        Not enough price data yet. Prices are recorded during sync cycles.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "13px",
          }}
          formatter={(v: number | undefined) => (v != null ? `$${v.toFixed(2)}` : "")}
          labelFormatter={(label) => {
            const d = new Date(String(label));
            return d.toLocaleDateString();
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="hsl(var(--secondary))"
          fillOpacity={1}
          fill="url(#priceGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
