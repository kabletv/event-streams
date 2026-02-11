"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EventTypeBadge } from "@/components/event-type-badge";
import { StreamFiltersBar } from "./stream-filters";
import { JsonPayloadViewer } from "./json-payload-viewer";
import { fetchStreamEvents } from "@/lib/actions/stream";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import type { EventRow, PaginatedEvents, StreamFilters } from "@/lib/queries/types";
import type { Device, Profile, Location } from "@/lib/queries/types";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

interface StreamClientProps {
  initialEvents: PaginatedEvents;
  devices: Device[];
  profiles: Profile[];
  locations: Location[];
  eventTypes: string[];
  filters: StreamFilters;
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

function truncatePayload(payload: Record<string, unknown>, maxLen = 100): string {
  const str = JSON.stringify(payload);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

function resolveDeviceName(
  deviceId: string | null,
  devices: Device[],
): string {
  if (!deviceId) return "—";
  const device = devices.find((d) => d.id === deviceId);
  return device?.name ?? deviceId.slice(0, 8) + "…";
}

function resolveProfileName(
  event: EventRow,
  profiles: Profile[],
): string {
  // Check primary_profile_id first, then payload fields
  const profileId =
    event.primaryProfileId ??
    (event.payload?.profile_id as string | undefined) ??
    null;

  // Also check profile_ids_present array
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

export function StreamClient({
  initialEvents,
  devices,
  profiles,
  locations,
  eventTypes,
  filters: initialFilters,
}: StreamClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [events, setEvents] = useState<EventRow[]>(initialEvents.rows);
  const [total, setTotal] = useState(initialEvents.total);
  const [offset, setOffset] = useState(initialEvents.rows.length);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Parse current filters from URL
  const currentFilters: StreamFilters = {
    eventTypes: searchParams.get("types")
      ? searchParams.get("types")!.split(",")
      : undefined,
    deviceId: searchParams.get("device") ?? undefined,
    profileId: searchParams.get("profile") ?? undefined,
    locationId: searchParams.get("location") ?? undefined,
  };

  // Update URL when filters change
  const updateFilters = useCallback(
    (newFilters: StreamFilters) => {
      const params = new URLSearchParams();
      if (newFilters.eventTypes && newFilters.eventTypes.length > 0) {
        params.set("types", newFilters.eventTypes.join(","));
      }
      if (newFilters.deviceId) {
        params.set("device", newFilters.deviceId);
      }
      if (newFilters.profileId) {
        params.set("profile", newFilters.profileId);
      }
      if (newFilters.locationId) {
        params.set("location", newFilters.locationId);
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  // Refresh events (for auto-refresh and manual refresh)
  const refreshEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchStreamEvents(PAGE_SIZE, 0, currentFilters);
      setEvents(result.rows);
      setTotal(result.total);
      setOffset(result.rows.length);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  // Re-fetch when initialEvents change (filters changed via URL → server re-render)
  useEffect(() => {
    setEvents(initialEvents.rows);
    setTotal(initialEvents.total);
    setOffset(initialEvents.rows.length);
    setExpandedRows(new Set());
  }, [initialEvents]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      try {
        const result = await fetchStreamEvents(PAGE_SIZE, 0, currentFilters);
        setEvents((prev) => {
          // Deduplicate by id, prepend new
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = result.rows.filter((e) => !existingIds.has(e.id));
          if (newEvents.length === 0) return prev;
          return [...newEvents, ...prev];
        });
        setTotal(result.total);
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, currentFilters]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const result = await fetchStreamEvents(PAGE_SIZE, offset, currentFilters);
      setEvents((prev) => [...prev, ...result.rows]);
      setOffset((prev) => prev + result.rows.length);
      setTotal(result.total);
    } finally {
      setLoadingMore(false);
    }
  }, [offset, currentFilters]);

  // Toggle row expansion
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

  const hasActiveFilters =
    (currentFilters.eventTypes && currentFilters.eventTypes.length > 0) ||
    currentFilters.deviceId ||
    currentFilters.profileId ||
    currentFilters.locationId;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <StreamFiltersBar
        filters={currentFilters}
        eventTypes={eventTypes}
        devices={devices}
        profiles={profiles}
        locations={locations}
        onFiltersChange={updateFilters}
        onClear={clearFilters}
        hasActiveFilters={!!hasActiveFilters}
      />

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} event{total !== 1 ? "s" : ""} total
          {hasActiveFilters && " (filtered)"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshEvents}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 text-xs"
          >
            <div
              className={`relative h-5 w-9 rounded-full transition-colors ${
                autoRefresh ? "bg-green-600" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  autoRefresh ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-muted-foreground">
              Auto-refresh
              {autoRefresh && (
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Event table */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No events found
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : "Events will appear here as they arrive."}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
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
                    <EventTableRow
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

          {/* Load more */}
          {offset < total && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : `Load more (${total - offset} remaining)`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Event table row                                                   */
/* ------------------------------------------------------------------ */

interface EventTableRowProps {
  event: EventRow;
  isExpanded: boolean;
  onToggle: () => void;
  devices: Device[];
  profiles: Profile[];
}

function EventTableRow({
  event,
  isExpanded,
  onToggle,
  devices,
  profiles,
}: EventTableRowProps) {
  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={onToggle}
      >
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
          {resolveDeviceName(event.deviceId, devices)}
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
