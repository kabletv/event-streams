import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { getDeviceById } from "@/lib/queries/reference";
import { getDeviceEventVolume, getDeviceEvents } from "@/lib/queries/devices";
import { getProfiles } from "@/lib/queries/reference";
import { DeviceTimelineChart } from "@/components/devices/device-timeline-chart";
import { DeviceEventStream } from "@/components/devices/device-event-stream";
import { ChartSkeleton } from "@/components/overview/skeletons";
import { DevicesTableSkeleton } from "@/components/devices/skeletons";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 50;

interface DeviceDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function DeviceHeader({ deviceId }: { deviceId: string }) {
  const device = await getDeviceById(deviceId);
  if (!device) notFound();

  return (
    <div className="space-y-1">
      <Link
        href="/devices"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Devices
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {device.name ?? device.id}
        </h1>
        {device.deviceType && (
          <Badge variant="outline" className="text-xs">
            {device.deviceType}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {device.locationName && <span>📍 {device.locationName}</span>}
        <span className="font-mono text-xs">{device.id}</span>
      </div>
    </div>
  );
}

async function DeviceTimeline({
  deviceId,
  range,
}: {
  deviceId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const volumeData = await getDeviceEventVolume(deviceId, timeRange);

  return <DeviceTimelineChart data={volumeData} />;
}

async function DeviceEvents({
  deviceId,
  range,
}: {
  deviceId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const [events, profiles] = await Promise.all([
    getDeviceEvents(deviceId, timeRange, PAGE_SIZE, 0),
    getProfiles(),
  ]);

  return (
    <DeviceEventStream
      deviceId={deviceId}
      range={range}
      initialEvents={events}
      profiles={profiles}
    />
  );
}

export default async function DeviceDetailPage({
  params,
  searchParams,
}: DeviceDetailPageProps) {
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
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            </div>
          }
        >
          <DeviceHeader deviceId={id} />
        </Suspense>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <DeviceTimeline deviceId={id} range={range} />
      </Suspense>

      <Suspense fallback={<DevicesTableSkeleton />}>
        <DeviceEvents deviceId={id} range={range} />
      </Suspense>
    </div>
  );
}
