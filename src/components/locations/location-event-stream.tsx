"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EventTypeBadge } from "@/components/event-type-badge";
import { JsonPayloadViewer } from "@/components/stream/json-payload-viewer";
import { fetchLocationEvents } from "@/lib/actions/locations";
import type { EventRow, PaginatedEvents, Device, Profile } from "@/lib/queries/types";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

const PAGE_SIZE = 50;

interface LocationEventStreamProps {
  locationId: string;
  range: string;
  initialEvents: PaginatedEvents;
  devices: Device[];
  profiles: Profile[];
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

function resolveDeviceName(deviceId: string | null, devices: Device[]): string {
  if (!deviceId) return "—";
  const device = devices.find((d) => d.id === deviceId);
  return device?.name ?? deviceId.slice(0, 8) + "…";
}

function resolveProfileName(event: EventRow, profiles: Profile[]): string {
  const profileId =
    event.primaryProfileId ??
    (event.payload?.profile_id as string | undefined) ??
    null;

  const profileIds = event.payload?.profile_ids_present as string[] | undefined;

  if (profileId) {
    const profile = profiles.find((p) => p.id === profileId);
    return profile?.displayName ?? profileId.slice(0, 8) + "…";
  }
  if (profileIds && profileIds.length > 0) {
    const names = profileIds.map((id) => {
      const profile = profiles.find((p) => p.id === id);
      return profile?.displayName ?? id.slice(0, 8) + "…";
    });
    return names.join(", ");
  }
  return "—";
}

function truncatePayload(payload: Record<string, unknown>, maxLen = 100): string {
  const str = JSON.stringify(payload);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function LocationEventStream({
  locationId,
  range,
  initialEvents,
  devices,
  profiles,
}: LocationEventStreamProps) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents.rows);
  const [total, setTotal] = useState(initialEvents.total);
  const [offset, setOffset] = useState(initialEvents.rows.length);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLocationEvents(locationId, range, PAGE_SIZE, 0);
      setEvents(result.rows);
      setTotal(result.total);
      setOffset(result.rows.length);
      setExpandedRows(new Set());
    } finally {
      setLoading(false);
    }
  }, [locationId, range]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const result = await fetchLocationEvents(locationId, range, PAGE_SIZE, offset);
      setEvents((prev) => [...prev, ...result.rows]);
      setOffset((prev) => prev + result.rows.length);
      setTotal(result.total);
    } finally {
      setLoadingMore(false);
    }
  }, [locationId, range, offset]);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Stream</CardTitle>
            <CardDescription>
              {total.toLocaleString()} event{total !== 1 ? "s" : ""} in range
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No events found
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              This location has no events in the selected time range.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Payload Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const isExpanded = expandedRows.has(event.id);
                    return (
                      <LocationEventRow
                        key={event.id}
                        event={event}
                        isExpanded={isExpanded}
                        onToggle={() => toggleRow(event.id)}
                        devices={devices}
                        profiles={profiles}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {offset < total && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? "Loading…"
                    : `Load more (${total - offset} remaining)`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Event row                                                         */
/* ------------------------------------------------------------------ */

interface LocationEventRowProps {
  event: EventRow;
  isExpanded: boolean;
  onToggle: () => void;
  devices: Device[];
  profiles: Profile[];
}

function LocationEventRow({
  event,
  isExpanded,
  onToggle,
  devices,
  profiles,
}: LocationEventRowProps) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell className="w-8">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell
          title={event.createdAt.toISOString()}
          className="text-muted-foreground"
        >
          {formatRelativeTime(event.createdAt)}
        </TableCell>
        <TableCell>
          <EventTypeBadge type={event.eventType} />
        </TableCell>
        <TableCell className="text-muted-foreground">
          {event.deviceId ? (
            <Link
              href={`/devices/${event.deviceId}`}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {resolveDeviceName(event.deviceId, devices)}
            </Link>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {resolveProfileName(event, profiles)}
        </TableCell>
        <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
          {truncatePayload(event.payload)}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={6} className="p-0">
            <JsonPayloadViewer payload={event.payload} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
