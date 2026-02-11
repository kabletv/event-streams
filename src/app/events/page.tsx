import { Suspense } from "react";
import Link from "next/link";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { getEventTypeCounts } from "@/lib/queries/events";
import { EventTypeBadge } from "@/components/event-type-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/overview/skeletons";

interface EventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function EventTypesTable({ range }: { range: string }) {
  const timeRange = timeRangeFromParams({ range });
  const counts = await getEventTypeCounts(timeRange);

  const totalEvents = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Event Types</CardTitle>
        <CardDescription>
          {counts.length} event type{counts.length !== 1 ? "s" : ""} &middot;{" "}
          {totalEvents.toLocaleString()} total events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {counts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No events found in the selected time range.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counts.map((row) => {
                  const pct = totalEvents > 0
                    ? ((row.count / totalEvents) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <TableRow key={row.eventType} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/events/${encodeURIComponent(row.eventType)}`}
                          className="inline-flex items-center gap-2 hover:underline"
                        >
                          <EventTypeBadge type={row.eventType} />
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {pct}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const sp = await searchParams;
  const rangeRaw = sp.range;
  const range = (Array.isArray(rangeRaw) ? rangeRaw[0] : rangeRaw) ?? "24h";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Browse all event types. Click a type to see detailed analysis.
          </p>
        </div>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <EventTypesTable range={range} />
      </Suspense>
    </div>
  );
}
