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
import { VolumeChart } from "@/components/charts/volume-chart";
import { EventBadge } from "@/components/event-badge";
import { RelativeTime } from "@/components/relative-time";
import { JsonViewer } from "@/components/json-viewer";
import { ChartSkeleton, TableSkeleton } from "@/components/loading-skeleton";
import { getDeviceEvents, getDeviceTimeSeries } from "@/lib/queries";
import { getDevices, getDeviceName } from "@/lib/db";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}

async function DeviceCharts({
  deviceId,
  hours,
}: {
  deviceId: string;
  hours: number;
}) {
  const timeSeries = await getDeviceTimeSeries(deviceId, hours);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <VolumeChart data={timeSeries} />
      </CardContent>
    </Card>
  );
}

async function DeviceEventStream({
  deviceId,
  hours,
}: {
  deviceId: string;
  hours: number;
}) {
  const events = await getDeviceEvents(deviceId, hours);

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No events in this time range.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Time</TableHead>
              <TableHead className="w-48">Event Type</TableHead>
              <TableHead>Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <RelativeTime date={event.created_at} />
                </TableCell>
                <TableCell>
                  <EventBadge eventType={event.event_type} />
                </TableCell>
                <TableCell>
                  <JsonViewer data={event.payload} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function DeviceDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const hours = getHoursFromRange(sp.range || "24h");
  const devices = await getDevices();
  const deviceName = getDeviceName(devices, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/devices"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Devices
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">{deviceName}</h2>
          <p className="text-sm text-muted-foreground font-mono">{id}</p>
        </div>
        <TimeRangeSelector />
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <DeviceCharts deviceId={id} hours={hours} />
      </Suspense>

      <Suspense fallback={<TableSkeleton rows={10} />}>
        <DeviceEventStream deviceId={id} hours={hours} />
      </Suspense>
    </div>
  );
}
