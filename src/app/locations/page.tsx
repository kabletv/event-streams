import { Suspense } from "react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { LocationsGrid } from "@/components/locations/locations-grid";
import { LocationsGridSkeleton } from "@/components/locations/skeletons";

interface LocationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = await searchParams;
  const timeRange = timeRangeFromParams(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            Location-based event distribution and activity maps.
          </p>
        </div>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<LocationsGridSkeleton />}>
        <LocationsGrid timeRange={timeRange} />
      </Suspense>
    </div>
  );
}
