import { Suspense } from "react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { ProfilesTable } from "@/components/profiles/profiles-table";
import { ProfilesTableSkeleton } from "@/components/profiles/skeletons";

interface ProfilesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfilesPage({ searchParams }: ProfilesPageProps) {
  const params = await searchParams;
  const timeRange = timeRangeFromParams(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profiles</h1>
          <p className="text-muted-foreground">
            User profiles and their associated event activity over time.
          </p>
        </div>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<ProfilesTableSkeleton />}>
        <ProfilesTable timeRange={timeRange} />
      </Suspense>
    </div>
  );
}
