/* ------------------------------------------------------------------ */
/*  Shared query result types                                         */
/* ------------------------------------------------------------------ */

/** A single time-bucket row for event volume charts */
export interface EventVolumeBucket {
  bucket: Date;
  eventType: string;
  count: number;
}

/** Aggregate count for a single event type */
export interface EventTypeCount {
  eventType: string;
  count: number;
}

/** High-level KPI stats for a time range */
export interface KPIStats {
  totalEvents: number;
  eventsPerMinute: number;
  uniqueDevices: number;
  uniqueProfiles: number;
  uniqueLocations: number;
}

/** A single event row from the event log */
export interface EventRow {
  id: string;
  createdAt: Date;
  eventType: string;
  deviceId: string | null;
  locationId: string | null;
  primaryProfileId: string | null;
  payload: Record<string, unknown>;
}

/** Paginated result wrapper */
export interface PaginatedEvents {
  rows: EventRow[];
  total: number;
}

/** Filters for querying events */
export interface EventFilters {
  eventType?: string;
  deviceId?: string;
  profileId?: string;
  locationId?: string;
}

/* ------------------------------------------------------------------ */
/*  Reference data types                                              */
/* ------------------------------------------------------------------ */

export interface Profile {
  id: string;
  displayName: string | null;
  metadata: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  name: string | null;
  deviceType: string | null;
  locationId: string | null;
  locationName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
