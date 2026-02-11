import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { KPICard } from "@/components/kpi-card";
import { VolumeChart } from "@/components/charts/volume-chart";
import { EventTypeBarChart } from "@/components/charts/bar-chart";
import { KPISkeleton, ChartSkeleton } from "@/components/loading-skeleton";
import { getKPIs, getTimeSeries, getEventTypeBreakdown } from "@/lib/queries";
import { getHoursFromRange } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

async function KPIRow({ hours }: { hours: number }) {
  const kpis = await getKPIs(hours);
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <KPICard title="Total Events" value={kpis.totalEvents} icon="📈" />
      <KPICard
        title="Events / Min"
        value={kpis.eventsPerMinute.toFixed(1)}
        icon="⚡"
      />
      <KPICard title="Active Devices" value={kpis.uniqueDevices} icon="🖥️" />
      <KPICard
        title="Active Profiles"
        value={kpis.uniqueProfiles}
        icon="👤"
      />
      <KPICard
        title="Active Locations"
        value={kpis.uniqueLocations}
        icon="📍"
      />
    </div>
  );
}

async function TimeSeriesChart({ hours }: { hours: number }) {
  const data = await getTimeSeries(hours);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event Volume Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <VolumeChart data={data} />
      </CardContent>
    </Card>
  );
}

async function BreakdownChart({ hours }: { hours: number }) {
  const data = await getEventTypeBreakdown(hours);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event Type Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <EventTypeBarChart
          data={data}
          height={Math.max(300, data.length * 28)}
        />
      </CardContent>
    </Card>
  );
}

export default async function OverviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hours = getHoursFromRange(params.range || "24h");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <TimeRangeSelector />
      </div>

      <Suspense fallback={<KPISkeleton />}>
        <KPIRow hours={hours} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <TimeSeriesChart hours={hours} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton height={400} />}>
        <BreakdownChart hours={hours} />
      </Suspense>
    </div>
  );
}
