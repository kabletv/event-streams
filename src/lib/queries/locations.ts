import { eventsPool, mainPool } from "@/lib/db";
import type { TimeRange } from "@/lib/time-range";
import type { EventVolumeBucket, EventRow, EventTypeCount } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Aggregated event stats for a single location (from TimescaleDB) */
export interface LocationEventStats {
  locationId: string;
  eventCount: number;
}

/** Device count per location (from main DB) */
export interface LocationDeviceCount {
  locationId: string;
  deviceCount: number;
}

/** Profile count per location (from main DB) */
export interface LocationProfileCount {
  locationId: string;
  profileCount: number;
}

/** Sparkline data point for a single location */
export interface SparklinePoint {
  time: string;
  count: number;
}

/** Sparkline data grouped by location */
export interface LocationSparklineData {
  locationId: string;
  data: SparklinePoint[];
}

/* ------------------------------------------------------------------ */
/*  Location event stats — aggregate per location for list page       */
/* ------------------------------------------------------------------ */

export async function getLocationEventStats(
  timeRange: TimeRange,
): Promise<LocationEventStats[]> {
  const { rows } = await eventsPool.query(
    `SELECT location_id, COUNT(*)::int AS event_count
     FROM event_log
     WHERE created_at >= $1 AND created_at <= $2
       AND location_id IS NOT NULL
     GROUP BY location_id`,
    [timeRange.start, timeRange.end],
  );

  return rows.map((r: Record<string, unknown>) => ({
    locationId: r.location_id as string,
    eventCount: r.event_count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Device counts per location (main DB)                              */
/* ------------------------------------------------------------------ */

export async function getLocationDeviceCounts(): Promise<LocationDeviceCount[]> {
  const { rows } = await mainPool.query(
    `SELECT location_id, COUNT(*)::int AS device_count
     FROM device
     WHERE location_id IS NOT NULL
     GROUP BY location_id`,
  );

  return rows.map((r: Record<string, unknown>) => ({
    locationId: r.location_id as string,
    deviceCount: r.device_count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Profile counts per location (main DB)                             */
/* ------------------------------------------------------------------ */

export async function getLocationProfileCounts(): Promise<LocationProfileCount[]> {
  const { rows } = await mainPool.query(
    `SELECT location_id, COUNT(*)::int AS profile_count
     FROM locations_profiles
     GROUP BY location_id`,
  );

  return rows.map((r: Record<string, unknown>) => ({
    locationId: r.location_id as string,
    profileCount: r.profile_count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Sparkline data per location (TimescaleDB)                         */
/* ------------------------------------------------------------------ */

export async function getLocationSparklines(
  timeRange: TimeRange,
): Promise<LocationSparklineData[]> {
  const { rows } = await eventsPool.query(
    `SELECT
       location_id,
       time_bucket('1 hour', created_at) AS bucket,
       COUNT(*)::int AS count
     FROM event_log
     WHERE created_at >= $1 AND created_at <= $2
       AND location_id IS NOT NULL
     GROUP BY location_id, bucket
     ORDER BY location_id, bucket`,
    [timeRange.start, timeRange.end],
  );

  const map = new Map<string, SparklinePoint[]>();
  for (const row of rows) {
    const locId = row.location_id as string;
    if (!map.has(locId)) {
      map.set(locId, []);
    }
    map.get(locId)!.push({
      time: new Date(row.bucket as string).toISOString(),
      count: row.count as number,
    });
  }

  return Array.from(map.entries()).map(([locationId, data]) => ({
    locationId,
    data,
  }));
}

/* ------------------------------------------------------------------ */
/*  Location event volume — time_bucket for timeline chart            */
/* ------------------------------------------------------------------ */

export async function getLocationEventVolume(
  locationId: string,
  timeRange: TimeRange,
): Promise<EventVolumeBucket[]> {
  const { rows } = await eventsPool.query(
    `SELECT time_bucket($1::interval, created_at) AS bucket,
            event_type,
            COUNT(*)::int AS count
     FROM event_log
     WHERE location_id = $2 AND created_at >= $3 AND created_at <= $4
     GROUP BY bucket, event_type
     ORDER BY bucket`,
    [timeRange.bucket, locationId, timeRange.start, timeRange.end],
  );

  return rows.map((r: Record<string, unknown>) => ({
    bucket: new Date(r.bucket as string),
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Location activity breakdown — count per event_type                */
/* ------------------------------------------------------------------ */

export async function getLocationActivityBreakdown(
  locationId: string,
  timeRange: TimeRange,
): Promise<EventTypeCount[]> {
  const { rows } = await eventsPool.query(
    `SELECT event_type, COUNT(*)::int AS count
     FROM event_log
     WHERE location_id = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY event_type
     ORDER BY count DESC`,
    [locationId, timeRange.start, timeRange.end],
  );

  return rows.map((r: Record<string, unknown>) => ({
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Location events — paginated for the detail event stream           */
/* ------------------------------------------------------------------ */

export interface PaginatedLocationEvents {
  rows: EventRow[];
  total: number;
}

function mapEventRow(row: Record<string, unknown>): EventRow {
  return {
    id: row.id as string,
    createdAt: new Date(row.created_at as string),
    eventType: row.event_type as string,
    deviceId: (row.device_id as string) ?? null,
    locationId: (row.location_id as string) ?? null,
    primaryProfileId: (row.primary_profile_id as string) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
  };
}

export async function getLocationEvents(
  locationId: string,
  timeRange: TimeRange,
  limit: number,
  offset: number,
): Promise<PaginatedLocationEvents> {
  const [countResult, dataResult] = await Promise.all([
    eventsPool.query(
      `SELECT COUNT(*)::int AS total FROM event_log
       WHERE location_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [locationId, timeRange.start, timeRange.end],
    ),
    eventsPool.query(
      `SELECT * FROM event_log
       WHERE location_id = $1 AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at DESC
       LIMIT $4 OFFSET $5`,
      [locationId, timeRange.start, timeRange.end, limit, offset],
    ),
  ]);

  return {
    rows: dataResult.rows.map(mapEventRow),
    total: countResult.rows[0].total as number,
  };
}
