import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkline } from "@/components/sparkline";
import { getLocations } from "@/lib/queries/reference";
import {
  getLocationEventStats,
  getLocationDeviceCounts,
  getLocationProfileCounts,
  getLocationSparklines,
} from "@/lib/queries/locations";
import type { TimeRange } from "@/lib/time-range";
import type { Location } from "@/lib/queries/types";
import type {
  LocationEventStats,
  LocationDeviceCount,
  LocationProfileCount,
  LocationSparklineData,
} from "@/lib/queries/locations";

interface LocationsGridProps {
  timeRange: TimeRange;
}

interface LocationCardData {
  location: Location;
  eventCount: number;
  deviceCount: number;
  profileCount: number;
  sparklineData: { time: string; count: number }[];
}

export async function LocationsGrid({ timeRange }: LocationsGridProps) {
  const [locations, eventStats, deviceCounts, profileCounts, sparklines] =
    await Promise.all([
      getLocations(),
      getLocationEventStats(timeRange),
      getLocationDeviceCounts(),
      getLocationProfileCounts(),
      getLocationSparklines(timeRange),
    ]);

  // Build lookup maps
  const eventStatsMap = new Map<string, LocationEventStats>(
    eventStats.map((s) => [s.locationId, s]),
  );
  const deviceCountMap = new Map<string, LocationDeviceCount>(
    deviceCounts.map((d) => [d.locationId, d]),
  );
  const profileCountMap = new Map<string, LocationProfileCount>(
    profileCounts.map((p) => [p.locationId, p]),
  );
  const sparklineMap = new Map<string, LocationSparklineData>(
    sparklines.map((s) => [s.locationId, s]),
  );

  // Merge and sort by event count desc
  const cards: LocationCardData[] = locations
    .map((location) => ({
      location,
      eventCount: eventStatsMap.get(location.id)?.eventCount ?? 0,
      deviceCount: deviceCountMap.get(location.id)?.deviceCount ?? 0,
      profileCount: profileCountMap.get(location.id)?.profileCount ?? 0,
      sparklineData: sparklineMap.get(location.id)?.data ?? [],
    }))
    .sort((a, b) => b.eventCount - a.eventCount);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No locations found
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Locations will appear here once registered.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Link href={`/locations/${card.location.id}`} key={card.location.id}>
          <Card className="transition-colors hover:bg-muted/50 cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {card.location.name}
              </CardTitle>
              <CardDescription className="text-xs font-mono">
                {card.location.id.slice(0, 12)}…
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <span>{card.deviceCount} device{card.deviceCount !== 1 ? "s" : ""}</span>
                  <span>{card.profileCount} profile{card.profileCount !== 1 ? "s" : ""}</span>
                  <span>{card.eventCount.toLocaleString()} event{card.eventCount !== 1 ? "s" : ""}</span>
                </div>
                <Sparkline data={card.sparklineData} />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
