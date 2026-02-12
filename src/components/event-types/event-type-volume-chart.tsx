"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import type { EventVolumeBucket } from "@/lib/queries/types";

interface EventTypeVolumeChartProps {
  eventType: string;
  data: EventVolumeBucket[];
}

interface ChartDataPoint {
  bucket: string;
  bucketDate: Date;
  count: number;
}

function formatBucketLabel(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

export function EventTypeVolumeChart({ eventType, data }: EventTypeVolumeChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volume Over Time</CardTitle>
          <CardDescription>Event count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">No events in the selected time range.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartDataPoint[] = data
    .map((row) => ({
      bucket: formatBucketLabel(row.bucket),
      bucketDate: row.bucket,
      count: row.count,
    }))
    .sort((a, b) => a.bucketDate.getTime() - b.bucketDate.getTime());

  const color = EVENT_TYPE_COLORS[eventType] || "#6b7280";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume Over Time</CardTitle>
        <CardDescription>Event count over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value: number | undefined) => [(value ?? 0).toLocaleString(), "Count"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              name={eventType.replace(/_/g, " ")}
              stroke={color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
