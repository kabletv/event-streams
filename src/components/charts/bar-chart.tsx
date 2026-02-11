"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getEventColor } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface EventTypeBarChartProps {
  data: { event_type: string; count: number }[];
  height?: number;
}

export function EventTypeBarChart({
  data,
  height = 400,
}: EventTypeBarChartProps) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout="vertical"
        margin={{ left: 140 }}
        onClick={(e) => {
          if (e?.activeLabel) {
            router.push(`/events/${encodeURIComponent(e.activeLabel)}`);
          }
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          horizontal={false}
        />
        <XAxis
          type="number"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="event_type"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          width={130}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          cursor={{ fill: "hsl(var(--accent))" }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} className="cursor-pointer">
          {data.map((entry) => (
            <Cell
              key={entry.event_type}
              fill={getEventColor(entry.event_type)}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
