"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: { time: string; count: number }[];
}

export function Sparkline({ data }: SparklineProps) {
  if (data.length === 0) {
    return (
      <div className="h-10 w-[120px] flex items-center justify-center">
        <span className="text-xs text-muted-foreground/50">—</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width={120} height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="count"
          stroke="#60a5fa"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
