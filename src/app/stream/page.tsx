import { Suspense } from "react";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { TableSkeleton } from "@/components/loading-skeleton";
import { StreamContent } from "./stream-content";
import { getStreamEvents, getDistinctEventTypes } from "@/lib/queries";
import {
  getProfiles,
  getDevices,
  getLocations,
} from "@/lib/db";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{
    range?: string;
    types?: string;
    device?: string;
    profile?: string;
    location?: string;
  }>;
}

async function StreamData({
  hours,
  types,
  device,
  profile,
  location,
}: {
  hours: number;
  types?: string;
  device?: string;
  profile?: string;
  location?: string;
}) {
  const eventTypes = types ? types.split(",") : undefined;

  const [events, profiles, devices, locations, distinctEventTypes] =
    await Promise.all([
      getStreamEvents(hours, 50, 0, eventTypes, device, profile, location),
      getProfiles(),
      getDevices(),
      getLocations(),
      getDistinctEventTypes(hours),
    ]);

  const serializedProfiles = Object.fromEntries(profiles);
  const serializedDevices = Object.fromEntries(devices);
  const serializedLocations = Object.fromEntries(locations);

  return (
    <StreamContent
      initialEvents={events}
      profiles={serializedProfiles}
      devices={serializedDevices}
      locations={serializedLocations}
      eventTypes={distinctEventTypes}
    />
  );
}

export default async function StreamPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hours = getHoursFromRange(params.range || "24h");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Activity Stream</h2>
        <TimeRangeSelector />
      </div>

      <Suspense fallback={<TableSkeleton rows={15} />}>
        <StreamData
          hours={hours}
          types={params.types}
          device={params.device}
          profile={params.profile}
          location={params.location}
        />
      </Suspense>
    </div>
  );
}
