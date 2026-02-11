"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import type { EventVolumeBucket } from "@/lib/queries/types";

interface DeviceTimelineChartProps {
  data: EventVolumeBucket[];
}

interface ChartDataPoint {
  bucket: string;
  bucketDate: Date;
  [eventType: string]: string | number | Date;
}

function formatBucketLabel(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

export function DeviceTimelineChart({ data }: DeviceTimelineChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>Event volume over time by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">No events in the selected time range.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pivot data: group by bucket, spread event types as columns
  const eventTypes = [...new Set(data.map((d) => d.eventType))];
  const bucketMap = new Map<string, ChartDataPoint>();

  for (const row of data) {
    const key = row.bucket.toISOString();
    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        bucket: formatBucketLabel(row.bucket),
        bucketDate: row.bucket,
      });
    }
    const point = bucketMap.get(key)!;
    point[row.eventType] = row.count;
  }

  const chartData = Array.from(bucketMap.values()).sort(
    (a, b) => a.bucketDate.getTime() - b.bucketDate.getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Timeline</CardTitle>
        <CardDescription>Event volume over time by type</CardDescription>
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
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value: string) => value.replace(/_/g, " ")}
            />
            {eventTypes.map((type) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                name={type}
                stroke={EVENT_TYPE_COLORS[type] || "#6b7280"}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
