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
import { getProfileEvents, getProfileTimeSeries } from "@/lib/queries";
import { getProfiles, getProfileName } from "@/lib/db";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}

async function ProfileCharts({
  profileId,
  hours,
}: {
  profileId: string;
  hours: number;
}) {
  const timeSeries = await getProfileTimeSeries(profileId, hours);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <VolumeChart data={timeSeries} />
      </CardContent>
    </Card>
  );
}

async function ProfileEventStream({
  profileId,
  hours,
}: {
  profileId: string;
  hours: number;
}) {
  const events = await getProfileEvents(profileId, hours);

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

export default async function ProfileDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const hours = getHoursFromRange(sp.range || "24h");
  const profiles = await getProfiles();
  const profileName = getProfileName(profiles, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/profiles"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Profiles
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">{profileName}</h2>
          <p className="text-sm text-muted-foreground font-mono">{id}</p>
        </div>
        <TimeRangeSelector />
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <ProfileCharts profileId={id} hours={hours} />
      </Suspense>

      <Suspense fallback={<TableSkeleton rows={10} />}>
        <ProfileEventStream profileId={id} hours={hours} />
      </Suspense>
    </div>
  );
}
