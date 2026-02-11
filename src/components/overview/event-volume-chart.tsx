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
import { format } from "date-fns";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import type { ReactNode } from "react";

interface DataPoint {
  bucket: string;
  [eventType: string]: number | string;
}

interface EventVolumeChartProps {
  data: DataPoint[];
  eventTypes: string[];
}

function formatXAxis(value: string): string {
  const date = new Date(value);
  return format(date, "MMM d HH:mm");
}

function formatTooltipLabel(label: ReactNode): ReactNode {
  if (typeof label !== "string") return label;
  const date = new Date(label);
  return format(date, "MMM d, yyyy HH:mm");
}

export function EventVolumeChart({ data, eventTypes }: EventVolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-muted-foreground">
        No event data for this time range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="bucket"
          tickFormatter={formatXAxis}
          stroke="#9ca3af"
          fontSize={12}
          tick={{ fill: "#9ca3af" }}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tick={{ fill: "#9ca3af" }}
          allowDecimals={false}
        />
        <Tooltip
          labelFormatter={formatTooltipLabel}
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "0.375rem",
            color: "#f9fafb",
          }}
          itemStyle={{ color: "#f9fafb" }}
          labelStyle={{ color: "#9ca3af" }}
        />
        <Legend />
        {eventTypes.map((type) => (
          <Line
            key={type}
            type="monotone"
            dataKey={type}
            stroke={EVENT_TYPE_COLORS[type] ?? "#9ca3af"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
