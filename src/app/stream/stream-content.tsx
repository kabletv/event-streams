"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
  eventTypes: string[];
}

export function StreamContent({
  initialEvents,
  profiles,
  devices,
  locations,
  eventTypes,
}: StreamContentProps) {
  const [events, setEvents] = useState(initialEvents);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Filter state from URL params
  const selectedTypes = searchParams.get("types")?.split(",").filter(Boolean) || [];
  const selectedDevice = searchParams.get("device") || "";
  const selectedProfile = searchParams.get("profile") || "";
  const selectedLocation = searchParams.get("location") || "";

  // Auto-refresh: poll by triggering a router refresh every 5 seconds
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        router.refresh();
      }, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, router]);

  // Sync server data into state when initialEvents changes (from refresh)
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/stream?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleEventType = useCallback(
    (type: string) => {
      const current = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];
      updateFilter("types", current.join(","));
    },
    [selectedTypes, updateFilter]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("types");
    params.delete("device");
    params.delete("profile");
    params.delete("location");
    router.push(`/stream?${params.toString()}`);
  }, [router, searchParams]);

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

  const hasActiveFilters =
    selectedTypes.length > 0 || selectedDevice || selectedProfile || selectedLocation;

  // Build device/profile/location lists from the reference data
  const deviceList = Object.values(devices).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const profileList = Object.values(profiles).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const locationList = Object.values(locations).sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-3">
            {/* Top row: auto-refresh toggle + clear */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Filters
              </span>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear all
                  </Button>
                )}
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className="text-xs"
                >
                  {autoRefresh ? "⏸ Pause" : "▶ Auto-refresh (5s)"}
                </Button>
              </div>
            </div>

            {/* Event type multi-select */}
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">
                Event Types
              </span>
              <div className="flex flex-wrap gap-1.5">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleEventType(type)}
                    className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                      selectedTypes.includes(type)
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {type.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Pickers row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Device
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => updateFilter("device", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">All devices</option>
                  {deviceList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Profile
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => updateFilter("profile", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">All profiles</option>
                  {profileList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => updateFilter("location", e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">All locations</option>
                  {locationList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events table */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No events matching filters.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Events ({events.length})
                {autoRefresh && (
                  <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
                )}
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
      )}
    </div>
  );
}
