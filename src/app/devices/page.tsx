import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { EventBadge } from "@/components/event-badge";
import { RelativeTime } from "@/components/relative-time";
import { TableSkeleton } from "@/components/loading-skeleton";
import { getDeviceStats } from "@/lib/queries";
import { getDevices, getLocations, getDeviceName, getLocationName } from "@/lib/db";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

async function DevicesTable({ hours }: { hours: number }) {
  const [stats, devices, locations] = await Promise.all([
    getDeviceStats(hours),
    getDevices(),
    getLocations(),
  ]);

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No device activity in this time range.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active Devices</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead>Last Event</TableHead>
              <TableHead>Top Event Types</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((row) => {
              const device = devices.get(row.device_id);
              return (
                <TableRow key={row.device_id}>
                  <TableCell>
                    <Link
                      href={`/devices/${row.device_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {getDeviceName(devices, row.device_id)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {device?.location_id
                      ? getLocationName(locations, device.location_id)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {device?.type || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.total_events.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <RelativeTime date={row.last_event} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(row.top_types || []).map((t) => (
                        <EventBadge key={t} eventType={t} />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function DevicesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hours = getHoursFromRange(params.range || "24h");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Devices</h2>
        <TimeRangeSelector />
      </div>

      <Suspense fallback={<TableSkeleton rows={8} />}>
        <DevicesTable hours={hours} />
      </Suspense>
    </div>
  );
}
