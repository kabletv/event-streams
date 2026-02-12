import { eventsPool } from "@/lib/db";
import type { TimeRange } from "@/lib/time-range";
import type { EventVolumeBucket, EventRow } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Aggregated event stats for a single device */
export interface DeviceEventStats {
  deviceId: string;
  eventCount: number;
  lastEvent: Date | null;
  typeCounts: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Device event stats — aggregate per device for list page           */
/* ------------------------------------------------------------------ */

export async function getDeviceEventStats(
  timeRange: TimeRange,
): Promise<DeviceEventStats[]> {
  const { rows } = await eventsPool.query(
    `SELECT
       device_id,
       COUNT(*)::int AS event_count,
       MAX(created_at) AS last_event,
       jsonb_object_agg(event_type, type_count) AS type_counts
     FROM (
       SELECT device_id, event_type, COUNT(*)::int AS type_count,
              MAX(created_at) AS created_at
       FROM event_log
       WHERE created_at >= $1 AND created_at <= $2
         AND device_id IS NOT NULL
       GROUP BY device_id, event_type
     ) sub
     GROUP BY device_id`,
    [timeRange.start, timeRange.end],
  );

  return rows.map((r: Record<string, unknown>) => ({
    deviceId: r.device_id as string,
    eventCount: r.event_count as number,
    lastEvent: r.last_event ? new Date(r.last_event as string) : null,
    typeCounts: (r.type_counts as Record<string, number>) ?? {},
  }));
}

/* ------------------------------------------------------------------ */
/*  Device event volume — time_bucket for timeline chart              */
/* ------------------------------------------------------------------ */

export async function getDeviceEventVolume(
  deviceId: string,
  timeRange: TimeRange,
): Promise<EventVolumeBucket[]> {
  const { rows } = await eventsPool.query(
    `SELECT time_bucket($1::interval, created_at) AS bucket,
            event_type,
            COUNT(*)::int AS count
     FROM event_log
     WHERE device_id = $2 AND created_at >= $3 AND created_at <= $4
     GROUP BY bucket, event_type
     ORDER BY bucket`,
    [timeRange.bucket, deviceId, timeRange.start, timeRange.end],
  );

  return rows.map((r: Record<string, unknown>) => ({
    bucket: new Date(r.bucket as string),
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Device events — paginated for the detail event stream             */
/* ------------------------------------------------------------------ */

export interface PaginatedDeviceEvents {
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

export async function getDeviceEvents(
  deviceId: string,
  timeRange: TimeRange,
  limit: number,
  offset: number,
): Promise<PaginatedDeviceEvents> {
  const [countResult, dataResult] = await Promise.all([
    eventsPool.query(
      `SELECT COUNT(*)::int AS total FROM event_log
       WHERE device_id = $1 AND created_at >= $2 AND created_at <= $3`,
      [deviceId, timeRange.start, timeRange.end],
    ),
    eventsPool.query(
      `SELECT * FROM event_log
       WHERE device_id = $1 AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at DESC
       LIMIT $4 OFFSET $5`,
      [deviceId, timeRange.start, timeRange.end, limit, offset],
    ),
  ]);

  return {
    rows: dataResult.rows.map(mapEventRow),
    total: countResult.rows[0].total as number,
  };
}
