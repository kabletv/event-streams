import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventVolume } from "@/lib/queries";
import type { TimeRange } from "@/lib/time-range";
import { EventVolumeChart } from "./event-volume-chart";

interface EventVolumeSectionProps {
  timeRange: TimeRange;
}

/**
 * Server component that fetches event volume data and passes it to the
 * client-side Recharts component.
 *
 * The raw query returns one row per (bucket, eventType). We pivot the data
 * into a flat array of objects keyed by bucket with each event type as a
 * numeric column — the shape Recharts expects for multi-line charts.
 */
export async function EventVolumeSection({ timeRange }: EventVolumeSectionProps) {
  const rawData = await getEventVolume(timeRange);

  // Collect unique event types
  const eventTypesSet = new Set<string>();
  for (const row of rawData) {
    eventTypesSet.add(row.eventType);
  }
  const eventTypes = Array.from(eventTypesSet).sort();

  // Pivot: bucket → { bucket, type1: count, type2: count, … }
  const bucketMap = new Map<string, { bucket: string; [key: string]: number | string }>();
  for (const row of rawData) {
    const key = row.bucket.toISOString();
    if (!bucketMap.has(key)) {
      const init: { bucket: string; [key: string]: number | string } = { bucket: key };
      for (const t of eventTypes) init[t] = 0;
      bucketMap.set(key, init);
    }
    bucketMap.get(key)![row.eventType] = row.count;
  }
  const data = Array.from(bucketMap.values()).sort(
    (a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Volume</CardTitle>
        <CardDescription>Events over time by type — {timeRange.label}</CardDescription>
      </CardHeader>
      <CardContent>
        <EventVolumeChart data={data} eventTypes={eventTypes} />
      </CardContent>
    </Card>
  );
}
