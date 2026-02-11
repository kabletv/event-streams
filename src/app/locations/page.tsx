import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { Sparkline } from "@/components/charts/sparkline";
import { TableSkeleton } from "@/components/loading-skeleton";
import { getLocationStats } from "@/lib/queries";
import { getLocations, getLocationName } from "@/lib/db";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

async function LocationCards({ hours }: { hours: number }) {
  const [stats, locations] = await Promise.all([
    getLocationStats(hours),
    getLocations(),
  ]);

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No location activity in this time range.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((loc) => {
        const location = locations.get(loc.location_id);
        return (
          <Link key={loc.location_id} href={`/locations/${loc.location_id}`}>
            <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {getLocationName(locations, loc.location_id)}
                </CardTitle>
                {location?.address && (
                  <p className="text-xs text-muted-foreground">
                    {location.address}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{loc.device_count}</p>
                    <p className="text-xs text-muted-foreground">Devices</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{loc.profile_count}</p>
                    <p className="text-xs text-muted-foreground">Profiles</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {loc.total_events.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                </div>
                <Sparkline data={loc.sparkline} />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default async function LocationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hours = getHoursFromRange(params.range || "24h");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
        <TimeRangeSelector />
      </div>

      <Suspense fallback={<TableSkeleton rows={6} />}>
        <LocationCards hours={hours} />
      </Suspense>
    </div>
  );
}
