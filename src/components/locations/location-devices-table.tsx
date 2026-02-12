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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Device } from "@/lib/queries/types";

interface LocationDevicesTableProps {
  devices: Device[];
}

const DEVICE_TYPE_COLORS: Record<string, string> = {
  hub: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  peripheral: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  thirdparty: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export function LocationDevicesTable({ devices }: LocationDevicesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices at this Location</CardTitle>
        <CardDescription>
          {devices.length} device{devices.length !== 1 ? "s" : ""} assigned
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No devices assigned to this location.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const typeClass =
                    DEVICE_TYPE_COLORS[device.deviceType ?? ""] ??
                    "bg-muted text-muted-foreground border-border";

                  return (
                    <TableRow key={device.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/devices/${device.id}`}
                          className="font-medium hover:underline"
                        >
                          {device.name ?? device.id.slice(0, 12) + "…"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {device.deviceType ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${typeClass}`}
                          >
                            {device.deviceType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {device.id.slice(0, 12)}…
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
