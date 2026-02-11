"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getEventColor } from "@/lib/constants";
import { TimeSeriesPoint } from "@/lib/queries";

interface VolumeChartProps {
  data: TimeSeriesPoint[];
  height?: number;
}

export function VolumeChart({ data, height = 350 }: VolumeChartProps) {
  // Pivot data: { bucket, type1: count, type2: count, ... }
  const buckets = new Map<string, Record<string, number>>();
  const types = new Set<string>();

  for (const point of data) {
    types.add(point.event_type);
    if (!buckets.has(point.bucket)) {
      buckets.set(point.bucket, {});
    }
    buckets.get(point.bucket)![point.event_type] = point.count;
  }

  const chartData = Array.from(buckets.entries())
    .map(([bucket, counts]) => ({
      bucket: new Date(bucket).toLocaleTimeString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      ...counts,
    }))
    .sort(
      (a, b) =>
        new Date(a.bucket).getTime() - new Date(b.bucket).getTime()
    );

  const sortedTypes = Array.from(types).sort();

  if (chartData.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground">
        No data for selected time range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="bucket"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        {sortedTypes.map((type) => (
          <Line
            key={type}
            type="monotone"
            dataKey={type}
            stroke={getEventColor(type)}
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
