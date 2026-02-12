import { Suspense } from "react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { DevicesTable } from "@/components/devices/devices-table";
import { DevicesTableSkeleton } from "@/components/devices/skeletons";

interface DevicesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const params = await searchParams;
  const timeRange = timeRangeFromParams(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">
            Connected devices and their event activity over time.
          </p>
        </div>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<DevicesTableSkeleton />}>
        <DevicesTable timeRange={timeRange} />
      </Suspense>
    </div>
  );
}
