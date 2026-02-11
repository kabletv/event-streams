import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TopDeviceRow } from "@/lib/queries/event-types";
import type { Device } from "@/lib/queries/types";

interface EventTypeTopDevicesProps {
  data: TopDeviceRow[];
  devices: Device[];
  totalCount: number;
}

export function EventTypeTopDevices({ data, devices, totalCount }: EventTypeTopDevicesProps) {
  const deviceMap = new Map(devices.map((d) => [d.id, d]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Devices</CardTitle>
        <CardDescription>
          {data.length} device{data.length !== 1 ? "s" : ""} emitting this event type
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No devices associated with this event type.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const device = deviceMap.get(row.deviceId);
                  const pct = totalCount > 0
                    ? ((row.count / totalCount) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <TableRow key={row.deviceId} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/devices/${row.deviceId}`}
                          className="font-medium hover:underline"
                        >
                          {device?.name ?? row.deviceId.slice(0, 12) + "…"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {pct}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
