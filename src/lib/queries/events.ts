import { eventsPool } from "@/lib/db";
import type { TimeRange } from "@/lib/time-range";
import type {
  EventVolumeBucket,
  EventTypeCount,
  KPIStats,
  EventRow,
  PaginatedEvents,
  EventFilters,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Event volume — count per time bucket, grouped by event_type       */
/* ------------------------------------------------------------------ */

export async function getEventVolume(
  timeRange: TimeRange,
  bucketInterval?: string,
): Promise<EventVolumeBucket[]> {
  const bucket = bucketInterval ?? timeRange.bucket;
  const { rows } = await eventsPool.query(
    `SELECT time_bucket($1::interval, created_at) AS bucket,
            event_type,
            COUNT(*)::int AS count
     FROM event_log
     WHERE created_at >= $2 AND created_at <= $3
     GROUP BY bucket, event_type
     ORDER BY bucket`,
    [bucket, timeRange.start, timeRange.end],
  );
  return rows.map((r: Record<string, unknown>) => ({
    bucket: new Date(r.bucket as string),
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Event type counts — total count per event_type                    */
/* ------------------------------------------------------------------ */

export async function getEventTypeCounts(
  timeRange: TimeRange,
): Promise<EventTypeCount[]> {
  const { rows } = await eventsPool.query(
    `SELECT event_type, COUNT(*)::int AS count
     FROM event_log
     WHERE created_at >= $1 AND created_at <= $2
     GROUP BY event_type
     ORDER BY count DESC`,
    [timeRange.start, timeRange.end],
  );
  return rows.map((r: Record<string, unknown>) => ({
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  KPI stats                                                         */
/* ------------------------------------------------------------------ */

export async function getKPIStats(timeRange: TimeRange): Promise<KPIStats> {
  const rangeMs =
    timeRange.end.getTime() - timeRange.start.getTime();
  const rangeMinutes = rangeMs / 60_000;

  // Run sub-queries in parallel
  const [totalsResult, profilesResult] = await Promise.all([
    eventsPool.query(
      `SELECT
         COUNT(*)::int AS total_events,
         COUNT(DISTINCT device_id)::int AS unique_devices,
         COUNT(DISTINCT location_id)::int AS unique_locations
       FROM event_log
       WHERE created_at >= $1 AND created_at <= $2`,
      [timeRange.start, timeRange.end],
    ),
    eventsPool.query(
      `SELECT COUNT(DISTINCT resolved_profile_id)::int AS unique_profiles FROM (
         SELECT COALESCE(primary_profile_id::text, payload->>'profile_id') AS resolved_profile_id
         FROM event_log
         WHERE created_at >= $1 AND created_at <= $2
           AND (primary_profile_id IS NOT NULL OR payload->>'profile_id' IS NOT NULL)
         UNION
         SELECT jsonb_array_elements_text(payload->'profile_ids_present') AS resolved_profile_id
         FROM event_log
         WHERE created_at >= $1 AND created_at <= $2
           AND payload->'profile_ids_present' IS NOT NULL
       ) sub
       WHERE resolved_profile_id IS NOT NULL`,
      [timeRange.start, timeRange.end],
    ),
  ]);

  const t = totalsResult.rows[0];
  const p = profilesResult.rows[0];
  const totalEvents = (t.total_events as number) ?? 0;

  return {
    totalEvents,
    eventsPerMinute:
      rangeMinutes > 0 ? Math.round((totalEvents / rangeMinutes) * 100) / 100 : 0,
    uniqueDevices: (t.unique_devices as number) ?? 0,
    uniqueProfiles: (p.unique_profiles as number) ?? 0,
    uniqueLocations: (t.unique_locations as number) ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Recent events — paginated feed with optional filters              */
/* ------------------------------------------------------------------ */

export async function getRecentEvents(
  limit: number,
  offset: number,
  filters?: EventFilters,
): Promise<PaginatedEvents> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.eventType) {
    conditions.push(`event_type = $${idx++}`);
    params.push(filters.eventType);
  }
  if (filters?.deviceId) {
    conditions.push(`device_id = $${idx++}`);
    params.push(filters.deviceId);
  }
  if (filters?.locationId) {
    conditions.push(`location_id = $${idx++}`);
    params.push(filters.locationId);
  }
  if (filters?.profileId) {
    conditions.push(
      `(COALESCE(primary_profile_id::text, payload->>'profile_id') = $${idx}
        OR (payload->'profile_ids_present' IS NOT NULL
            AND payload->'profile_ids_present' @> to_jsonb($${idx}::text)))`,
    );
    params.push(filters.profileId);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countQuery = `SELECT COUNT(*)::int AS total FROM event_log ${where}`;
  const dataQuery = `SELECT * FROM event_log ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;

  const [countResult, dataResult] = await Promise.all([
    eventsPool.query(countQuery, params),
    eventsPool.query(dataQuery, [...params, limit, offset]),
  ]);

  return {
    rows: dataResult.rows.map(mapEventRow),
    total: countResult.rows[0].total as number,
  };
}

/* ------------------------------------------------------------------ */
/*  Events by device                                                  */
/* ------------------------------------------------------------------ */

export async function getEventsByDevice(
  deviceId: string,
  timeRange: TimeRange,
): Promise<EventRow[]> {
  const { rows } = await eventsPool.query(
    `SELECT * FROM event_log
     WHERE device_id = $1 AND created_at >= $2 AND created_at <= $3
     ORDER BY created_at DESC`,
    [deviceId, timeRange.start, timeRange.end],
  );
  return rows.map(mapEventRow);
}

/* ------------------------------------------------------------------ */
/*  Events by profile (payload extraction)                            */
/* ------------------------------------------------------------------ */

export async function getEventsByProfile(
  profileId: string,
  timeRange: TimeRange,
): Promise<EventRow[]> {
  const { rows } = await eventsPool.query(
    `SELECT * FROM event_log
     WHERE created_at >= $1 AND created_at <= $2
       AND (
         COALESCE(primary_profile_id::text, payload->>'profile_id') = $3
         OR (payload->'profile_ids_present' IS NOT NULL
             AND payload->'profile_ids_present' @> to_jsonb($3::text))
       )
     ORDER BY created_at DESC`,
    [timeRange.start, timeRange.end, profileId],
  );
  return rows.map(mapEventRow);
}

/* ------------------------------------------------------------------ */
/*  Events by location                                                */
/* ------------------------------------------------------------------ */

export async function getEventsByLocation(
  locationId: string,
  timeRange: TimeRange,
): Promise<EventRow[]> {
  const { rows } = await eventsPool.query(
    `SELECT * FROM event_log
     WHERE location_id = $1 AND created_at >= $2 AND created_at <= $3
     ORDER BY created_at DESC`,
    [locationId, timeRange.start, timeRange.end],
  );
  return rows.map(mapEventRow);
}

/* ------------------------------------------------------------------ */
/*  Events by type                                                    */
/* ------------------------------------------------------------------ */

export async function getEventsByType(
  eventType: string,
  timeRange: TimeRange,
): Promise<EventRow[]> {
  const { rows } = await eventsPool.query(
    `SELECT * FROM event_log
     WHERE event_type = $1 AND created_at >= $2 AND created_at <= $3
     ORDER BY created_at DESC`,
    [eventType, timeRange.start, timeRange.end],
  );
  return rows.map(mapEventRow);
}
