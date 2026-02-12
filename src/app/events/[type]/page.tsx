import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { EventTypeBadge } from "@/components/event-type-badge";
import { getDevices, getProfiles } from "@/lib/queries/reference";
import {
  getEventTypeTotal,
  getEventTypeVolume,
  getEventTypeTopDevices,
  getEventTypeTopProfiles,
  getEventTypeSamplePayloads,
} from "@/lib/queries/event-types";
import {
  EventTypeVolumeChart,
  EventTypeTopDevices,
  EventTypeTopProfiles,
  EventTypeSamplePayloads,
  EventTypeTableSkeleton,
  SamplePayloadsSkeleton,
} from "@/components/event-types";
import { ChartSkeleton } from "@/components/overview/skeletons";

interface EventTypePageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function EventTypeHeader({
  eventType,
  range,
}: {
  eventType: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const total = await getEventTypeTotal(eventType, timeRange);

  if (total === 0) {
    return (
      <div className="space-y-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Overview
        </Link>
        <div className="flex items-center gap-3">
          <EventTypeBadge type={eventType} className="text-sm px-3 py-1" />
        </div>
        <p className="text-muted-foreground">
          No events found for type &quot;{eventType.replace(/_/g, " ")}&quot; in the selected time range.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Overview
      </Link>
      <div className="flex items-center gap-3">
        <EventTypeBadge type={eventType} className="text-sm px-3 py-1" />
        <span className="text-lg font-semibold text-muted-foreground">
          {total.toLocaleString()} events
        </span>
      </div>
    </div>
  );
}

async function VolumeSection({
  eventType,
  range,
}: {
  eventType: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const volumeData = await getEventTypeVolume(eventType, timeRange);

  return <EventTypeVolumeChart eventType={eventType} data={volumeData} />;
}

async function TopDevicesSection({
  eventType,
  range,
}: {
  eventType: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const [topDevices, devices, total] = await Promise.all([
    getEventTypeTopDevices(eventType, timeRange),
    getDevices(),
    getEventTypeTotal(eventType, timeRange),
  ]);

  return (
    <EventTypeTopDevices data={topDevices} devices={devices} totalCount={total} />
  );
}

async function TopProfilesSection({
  eventType,
  range,
}: {
  eventType: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const [topProfiles, profiles] = await Promise.all([
    getEventTypeTopProfiles(eventType, timeRange),
    getProfiles(),
  ]);

  return <EventTypeTopProfiles data={topProfiles} profiles={profiles} />;
}

async function SamplePayloadsSection({
  eventType,
  range,
}: {
  eventType: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const payloads = await getEventTypeSamplePayloads(eventType, timeRange, 10);

  return (
    <EventTypeSamplePayloads
      eventType={eventType}
      range={range}
      initialPayloads={payloads}
    />
  );
}

export default async function EventTypePage({
  params,
  searchParams,
}: EventTypePageProps) {
  const { type } = await params;
  const eventType = decodeURIComponent(type);
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
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            </div>
          }
        >
          <EventTypeHeader eventType={eventType} range={range} />
        </Suspense>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <VolumeSection eventType={eventType} range={range} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<EventTypeTableSkeleton />}>
          <TopDevicesSection eventType={eventType} range={range} />
        </Suspense>
        <Suspense fallback={<EventTypeTableSkeleton />}>
          <TopProfilesSection eventType={eventType} range={range} />
        </Suspense>
      </div>

      <Suspense fallback={<SamplePayloadsSkeleton />}>
        <SamplePayloadsSection eventType={eventType} range={range} />
      </Suspense>
    </div>
  );
}
