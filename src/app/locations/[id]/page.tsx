import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import {
  getLocationById,
  getDevices,
  getProfiles,
  getLocationProfiles,
} from "@/lib/queries/reference";
import {
  getLocationEventVolume,
  getLocationActivityBreakdown,
  getLocationEvents,
} from "@/lib/queries/locations";
import { LocationActivityChart } from "@/components/locations/location-activity-chart";
import { LocationTimelineChart } from "@/components/locations/location-timeline-chart";
import { LocationEventStream } from "@/components/locations/location-event-stream";
import { LocationDevicesTable } from "@/components/locations/location-devices-table";
import { LocationProfilesList } from "@/components/locations/location-profiles-list";
import { ChartSkeleton } from "@/components/overview/skeletons";
import { LocationDetailSkeleton } from "@/components/locations/skeletons";

const PAGE_SIZE = 50;

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function LocationHeader({ locationId }: { locationId: string }) {
  const location = await getLocationById(locationId);
  if (!location) notFound();

  return (
    <div className="space-y-1">
      <Link
        href="/locations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Locations
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {location.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{location.id}</span>
            <span>
              Created{" "}
              {location.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function LocationDevices({ locationId }: { locationId: string }) {
  const allDevices = await getDevices();
  const devices = allDevices.filter((d) => d.locationId === locationId);

  return <LocationDevicesTable devices={devices} />;
}

async function LocationProfiles({ locationId }: { locationId: string }) {
  const profiles = await getLocationProfiles(locationId);

  return <LocationProfilesList profiles={profiles} />;
}

async function LocationActivity({
  locationId,
  range,
}: {
  locationId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const breakdown = await getLocationActivityBreakdown(locationId, timeRange);

  return <LocationActivityChart data={breakdown} />;
}

async function LocationTimeline({
  locationId,
  range,
}: {
  locationId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const volumeData = await getLocationEventVolume(locationId, timeRange);

  return <LocationTimelineChart data={volumeData} />;
}

async function LocationEvents({
  locationId,
  range,
}: {
  locationId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const [events, devices, profiles] = await Promise.all([
    getLocationEvents(locationId, timeRange, PAGE_SIZE, 0),
    getDevices(),
    getProfiles(),
  ]);

  return (
    <LocationEventStream
      locationId={locationId}
      range={range}
      initialEvents={events}
      devices={devices}
      profiles={profiles}
    />
  );
}

export default async function LocationDetailPage({
  params,
  searchParams,
}: LocationDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const rangeRaw = sp.range;
  const range = (Array.isArray(rangeRaw) ? rangeRaw[0] : rangeRaw) ?? "24h";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Suspense
          fallback={
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          }
        >
          <LocationHeader locationId={id} />
        </Suspense>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<LocationDetailSkeleton />}>
          <LocationDevices locationId={id} />
        </Suspense>
        <Suspense fallback={<LocationDetailSkeleton />}>
          <LocationProfiles locationId={id} />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <LocationActivity locationId={id} range={range} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <LocationTimeline locationId={id} range={range} />
      </Suspense>

      <Suspense fallback={<LocationDetailSkeleton />}>
        <LocationEvents locationId={id} range={range} />
      </Suspense>
    </div>
  );
}
