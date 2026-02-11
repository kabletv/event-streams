"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import type { StreamFilters } from "@/lib/queries/types";
import type { Device, Profile, Location } from "@/lib/queries/types";
import { X, Filter } from "lucide-react";

interface StreamFiltersBarProps {
  filters: StreamFilters;
  eventTypes: string[];
  devices: Device[];
  profiles: Profile[];
  locations: Location[];
  onFiltersChange: (filters: StreamFilters) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function StreamFiltersBar({
  filters,
  eventTypes,
  devices,
  profiles,
  locations,
  onFiltersChange,
  onClear,
  hasActiveFilters,
}: StreamFiltersBarProps) {
  const toggleEventType = useCallback(
    (type: string) => {
      const current = filters.eventTypes ?? [];
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      onFiltersChange({ ...filters, eventTypes: next.length > 0 ? next : undefined });
    },
    [filters, onFiltersChange],
  );

  const removeEventType = useCallback(
    (type: string) => {
      const current = filters.eventTypes ?? [];
      const next = current.filter((t) => t !== type);
      onFiltersChange({ ...filters, eventTypes: next.length > 0 ? next : undefined });
    },
    [filters, onFiltersChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />

        {/* Event type multi-select chips */}
        <div className="flex flex-wrap gap-1">
          {eventTypes.map((type) => {
            const isSelected = filters.eventTypes?.includes(type) ?? false;
            const color = EVENT_TYPE_COLORS[type] || "#6b7280";
            return (
              <button
                key={type}
                onClick={() => toggleEventType(type)}
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-transparent text-white"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                style={isSelected ? { backgroundColor: color } : undefined}
              >
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {type.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Device picker */}
        <Select
          value={filters.deviceId ?? "__all__"}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              deviceId: val === "__all__" ? undefined : val,
            })
          }
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue placeholder="All devices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All devices</SelectItem>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name ?? d.id.slice(0, 8) + "…"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Profile picker */}
        <Select
          value={filters.profileId ?? "__all__"}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              profileId: val === "__all__" ? undefined : val,
            })
          }
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue placeholder="All profiles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All profiles</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.displayName ?? p.id.slice(0, 8) + "…"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location picker */}
        <Select
          value={filters.locationId ?? "__all__"}
          onValueChange={(val) =>
            onFiltersChange({
              ...filters,
              locationId: val === "__all__" ? undefined : val,
            })
          }
        >
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All locations</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active event type filter chips (removable) */}
      {filters.eventTypes && filters.eventTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground mr-1 self-center">
            Active:
          </span>
          {filters.eventTypes.map((type) => {
            const color = EVENT_TYPE_COLORS[type] || "#6b7280";
            return (
              <Badge
                key={type}
                className="gap-1 cursor-pointer"
                style={{
                  backgroundColor: color,
                  color: "#fff",
                  borderColor: color,
                }}
                onClick={() => removeEventType(type)}
              >
                {type.replace(/_/g, " ")}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
