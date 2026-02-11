import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EventTypeBadge } from "@/components/event-type-badge";
import { getDevices } from "@/lib/queries/reference";
import { getDeviceEventStats } from "@/lib/queries/devices";
import type { TimeRange } from "@/lib/time-range";
import type { Device } from "@/lib/queries/types";
import type { DeviceEventStats } from "@/lib/queries/devices";

interface DevicesTableProps {
  timeRange: TimeRange;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function getTop3EventTypes(
  typeCounts: Record<string, number>,
): Array<{ eventType: string; count: number }> {
  return Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([eventType, count]) => ({ eventType, count }));
}

const DEVICE_TYPE_COLORS: Record<string, string> = {
  hub: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  peripheral: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  thirdparty: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

interface DeviceRowData {
  device: Device;
  stats: DeviceEventStats | null;
}

export async function DevicesTable({ timeRange }: DevicesTableProps) {
  const [devices, statsArr] = await Promise.all([
    getDevices(),
    getDeviceEventStats(timeRange),
  ]);

  // Build a map of deviceId → stats
  const statsMap = new Map(statsArr.map((s) => [s.deviceId, s]));

  // Merge devices with stats, sort by event count desc
  const rows: DeviceRowData[] = devices
    .map((device) => ({
      device,
      stats: statsMap.get(device.id) ?? null,
    }))
    .sort((a, b) => (b.stats?.eventCount ?? 0) - (a.stats?.eventCount ?? 0));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No devices found
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Devices will appear here once registered.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Events</TableHead>
            <TableHead>Last Event</TableHead>
            <TableHead>Top Event Types</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ device, stats }) => {
            const top3 = stats ? getTop3EventTypes(stats.typeCounts) : [];
            const typeClass =
              DEVICE_TYPE_COLORS[device.deviceType ?? ""] ?? "bg-muted text-muted-foreground border-border";

            return (
              <TableRow key={device.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/devices/${device.id}`}
                    className="font-medium hover:underline"
                  >
                    {device.name ?? device.id.slice(0, 12) + "…"}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {device.locationName ?? "—"}
                </TableCell>
                <TableCell>
                  {device.deviceType ? (
                    <Badge variant="outline" className={`text-xs ${typeClass}`}>
                      {device.deviceType}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stats ? stats.eventCount.toLocaleString() : "0"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {stats?.lastEvent
                    ? formatRelativeTime(stats.lastEvent)
                    : "—"}
                </TableCell>
                <TableCell>
                  {top3.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {top3.map(({ eventType, count }) => (
                        <span key={eventType} className="inline-flex items-center gap-1">
                          <EventTypeBadge type={eventType} className="text-[10px] px-1.5 py-0" />
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {count.toLocaleString()}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
