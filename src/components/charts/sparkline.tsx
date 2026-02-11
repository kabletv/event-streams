"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface SparklineProps {
  data: { bucket: string; count: number }[];
  color?: string;
  height?: number;
}

export function Sparkline({
  data,
  color = "#60a5fa",
  height = 40,
}: SparklineProps) {
  if (data.length === 0) {
    return <div style={{ height }} className="text-muted-foreground text-xs flex items-center">—</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <Area
          type="monotone"
          dataKey="count"
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
