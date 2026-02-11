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
import { getEventTypeDetails } from "@/lib/queries";
import { getDevices, getProfiles, getDeviceName, getProfileName } from "@/lib/db";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ range?: string }>;
}

async function EventTypeContent({
  eventType,
  hours,
}: {
  eventType: string;
  hours: number;
}) {
  const [details, devices, profiles] = await Promise.all([
    getEventTypeDetails(eventType, hours),
    getDevices(),
    getProfiles(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volume Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <VolumeChart data={details.volume} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {details.topDevices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No device data</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.topDevices.map((d) => (
                    <TableRow key={d.device_id}>
                      <TableCell>
                        <Link
                          href={`/devices/${d.device_id}`}
                          className="text-primary hover:underline"
                        >
                          {getDeviceName(devices, d.device_id)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {d.count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Associated Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            {details.topProfiles.length === 0 ? (
              <p className="text-muted-foreground text-sm">No profile data</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.topProfiles.map((p) => (
                    <TableRow key={p.profile_id}>
                      <TableCell>
                        <Link
                          href={`/profiles/${p.profile_id}`}
                          className="text-primary hover:underline"
                        >
                          {getProfileName(profiles, p.profile_id)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {p.count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Payloads</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Time</TableHead>
                <TableHead>Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.samples.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <RelativeTime date={s.created_at} />
                  </TableCell>
                  <TableCell>
                    <JsonViewer data={s.payload} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EventTypePage({
  params,
  searchParams,
}: PageProps) {
  const { type } = await params;
  const sp = await searchParams;
  const eventType = decodeURIComponent(type);
  const hours = getHoursFromRange(sp.range || "24h");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Overview
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-bold tracking-tight">Event Type</h2>
            <EventBadge eventType={eventType} />
          </div>
        </div>
        <TimeRangeSelector />
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <ChartSkeleton />
            <div className="grid gap-4 md:grid-cols-2">
              <TableSkeleton rows={5} />
              <TableSkeleton rows={5} />
            </div>
            <TableSkeleton rows={5} />
          </div>
        }
      >
        <EventTypeContent eventType={eventType} hours={hours} />
      </Suspense>
    </div>
  );
}
