"use client";

import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ReactNode } from "react";

interface BreakdownItem {
  eventType: string;
  count: number;
  fill: string;
}

interface EventTypeBreakdownChartProps {
  data: BreakdownItem[];
}

function formatEventType(value: string): string {
  return value.replaceAll("_", " ");
}

function formatTooltipValue(value: number | undefined): [string, string] {
  return [(value ?? 0).toLocaleString(), "Count"];
}

function formatTooltipLabel(label: ReactNode): ReactNode {
  if (typeof label !== "string") return label;
  return formatEventType(label);
}

export function EventTypeBreakdownChart({ data }: EventTypeBreakdownChartProps) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-muted-foreground">
        No event types found for this time range.
      </div>
    );
  }

  const barHeight = 36;
  const chartHeight = Math.max(300, data.length * barHeight + 40);

  function handleClick(_data: unknown, index: number) {
    const item = data[index];
    if (item) {
      router.push(`/events/${encodeURIComponent(item.eventType)}`);
    }
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
        <XAxis
          type="number"
          stroke="#9ca3af"
          fontSize={12}
          tick={{ fill: "#9ca3af" }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="eventType"
          stroke="#9ca3af"
          fontSize={12}
          tick={{ fill: "#9ca3af" }}
          tickFormatter={formatEventType}
          width={160}
        />
        <Tooltip
          formatter={formatTooltipValue}
          labelFormatter={formatTooltipLabel}
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "0.375rem",
            color: "#f9fafb",
          }}
          itemStyle={{ color: "#f9fafb" }}
          labelStyle={{ color: "#9ca3af" }}
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
        />
        <Bar
          dataKey="count"
          radius={[0, 4, 4, 0]}
          className="cursor-pointer"
          onClick={handleClick}
        >
          {data.map((entry) => (
            <Cell
              key={entry.eventType}
              fill={entry.fill}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
