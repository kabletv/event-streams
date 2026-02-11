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
import { RelativeTime } from "@/components/relative-time";
import { TableSkeleton } from "@/components/loading-skeleton";
import { getProfileStats } from "@/lib/queries";
import { getProfiles, getProfileName } from "@/lib/db";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

async function ProfilesTable({ hours }: { hours: number }) {
  const [stats, profiles] = await Promise.all([
    getProfileStats(hours),
    getProfiles(),
  ]);

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No profile activity in this time range.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active Profiles</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="text-right">Devices</TableHead>
              <TableHead className="text-right">Locations</TableHead>
              <TableHead>Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((row) => (
              <TableRow key={row.profile_id}>
                <TableCell>
                  <Link
                    href={`/profiles/${row.profile_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {getProfileName(profiles, row.profile_id)}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.event_count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.distinct_devices}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.distinct_locations}
                </TableCell>
                <TableCell>
                  <RelativeTime date={row.last_active} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function ProfilesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hours = getHoursFromRange(params.range || "24h");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Profiles</h2>
        <TimeRangeSelector />
      </div>

      <Suspense fallback={<TableSkeleton rows={8} />}>
        <ProfilesTable hours={hours} />
      </Suspense>
    </div>
  );
}
