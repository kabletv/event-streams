"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventBadge } from "@/components/event-badge";
import { RelativeTime } from "@/components/relative-time";
import { JsonViewer } from "@/components/json-viewer";
import type { StreamEvent } from "@/lib/queries";
import type { Profile, Device, Location } from "@/lib/db";

interface StreamContentProps {
  initialEvents: StreamEvent[];
  profiles: Record<string, Profile>;
  devices: Record<string, Device>;
  locations: Record<string, Location>;
}

export function StreamContent({
  initialEvents,
  profiles,
  devices,
  locations,
}: StreamContentProps) {
  const events = initialEvents;

  function getDeviceName(id: string | null): string {
    if (!id) return "—";
    return devices[id]?.name || id.slice(0, 8);
  }

  function getProfileName(id: string | null): string {
    if (!id) return "—";
    return profiles[id]?.name || id.slice(0, 8);
  }

  function getLocationName(id: string | null): string {
    if (!id) return "—";
    return locations[id]?.display_name || id.slice(0, 8);
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No events matching filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Events ({events.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Time</TableHead>
              <TableHead className="w-48">Event Type</TableHead>
              <TableHead className="w-32">Device</TableHead>
              <TableHead className="w-32">Profile</TableHead>
              <TableHead className="w-32">Location</TableHead>
              <TableHead>Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <RelativeTime date={event.created_at} />
                </TableCell>
                <TableCell>
                  <EventBadge eventType={event.event_type} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getDeviceName(event.device_id)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getProfileName(event.resolved_profile_id)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getLocationName(event.location_id)}
                </TableCell>
                <TableCell>
                  <JsonViewer data={event.payload} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
