import { Suspense } from "react";
import { StreamClient } from "@/components/stream";
import { getStreamEvents, getDistinctEventTypes } from "@/lib/queries/events";
import { getDevices, getProfiles, getLocations } from "@/lib/queries/reference";
import type { StreamFilters } from "@/lib/queries/types";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 50;

interface StreamPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseStreamFilters(
  params: Record<string, string | string[] | undefined>,
): StreamFilters {
  const typesRaw = params.types;
  const types = typeof typesRaw === "string" ? typesRaw.split(",") : undefined;

  const deviceRaw = params.device;
  const deviceId = typeof deviceRaw === "string" ? deviceRaw : undefined;

  const profileRaw = params.profile;
  const profileId = typeof profileRaw === "string" ? profileRaw : undefined;

  const locationRaw = params.location;
  const locationId = typeof locationRaw === "string" ? locationRaw : undefined;

  return {
    eventTypes: types && types.length > 0 ? types : undefined,
    deviceId,
    profileId,
    locationId,
  };
}

async function StreamContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseStreamFilters(searchParams);

  const [events, devices, profiles, locations, eventTypes] = await Promise.all([
    getStreamEvents(PAGE_SIZE, 0, filters),
    getDevices(),
    getProfiles(),
    getLocations(),
    getDistinctEventTypes(),
  ]);

  return (
    <StreamClient
      initialEvents={events}
      devices={devices}
      profiles={profiles}
      locations={locations}
      eventTypes={eventTypes}
      filters={filters}
    />
  );
}

function StreamSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter bar skeleton */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-4" />
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-8 w-[180px]" />
        </div>
      </div>

      {/* Controls row skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border border-border">
        <div className="p-2 space-y-2">
          <div className="flex gap-4 p-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-48" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function StreamPage({ searchParams }: StreamPageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stream</h1>
        <p className="text-muted-foreground">
          Live event stream with real-time updates and filtering.
        </p>
      </div>

      <Suspense fallback={<StreamSkeleton />}>
        <StreamContent searchParams={params} />
      </Suspense>
    </div>
  );
}
