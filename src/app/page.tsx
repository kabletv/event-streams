import { Suspense } from "react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import {
  KPICards,
  EventVolumeSection,
  EventTypeBreakdownSection,
  KPISkeletons,
  ChartSkeleton,
} from "@/components/overview";

interface OverviewPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const params = await searchParams;
  const timeRange = timeRangeFromParams(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            High-level summary of event streams, device activity, and system health.
          </p>
        </div>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<KPISkeletons />}>
        <KPICards timeRange={timeRange} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <EventVolumeSection timeRange={timeRange} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <EventTypeBreakdownSection timeRange={timeRange} />
      </Suspense>
    </div>
  );
}
