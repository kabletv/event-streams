import { eventsPool } from "@/lib/db";
import type { TimeRange } from "@/lib/time-range";
import type { EventVolumeBucket, EventRow, EventTypeCount } from "./types";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Aggregated event stats for a single profile (from TimescaleDB) */
export interface ProfileEventStats {
  profileId: string;
  eventCount: number;
  deviceCount: number;
  locationCount: number;
  lastActive: Date | null;
}

/* ------------------------------------------------------------------ */
/*  Profile event stats — aggregate per profile for list page         */
/* ------------------------------------------------------------------ */

/**
 * Extracts profile IDs from JSONB payload fields and aggregates stats.
 * Uses payload->>'profile_id' and payload->'profile_ids_present' since
 * primary_profile_id is always NULL.
 */
export async function getProfileEventStats(
  timeRange: TimeRange,
): Promise<ProfileEventStats[]> {
  const { rows } = await eventsPool.query(
    `WITH profile_events AS (
       -- Method 1: Direct profile_id in payload
       SELECT
         payload->>'profile_id' AS profile_id,
         device_id,
         location_id,
         created_at
       FROM event_log
       WHERE created_at >= $1 AND created_at <= $2
         AND payload->>'profile_id' IS NOT NULL

       UNION ALL

       -- Method 2: profile_ids_present array (user_utterance, assistant_response)
       SELECT
         jsonb_array_elements_text(payload->'profile_ids_present') AS profile_id,
         device_id,
         location_id,
         created_at
       FROM event_log
       WHERE created_at >= $1 AND created_at <= $2
         AND payload->'profile_ids_present' IS NOT NULL
         AND jsonb_typeof(payload->'profile_ids_present') = 'array'
     )
     SELECT
       profile_id,
       COUNT(*)::int AS event_count,
       COUNT(DISTINCT device_id)::int AS device_count,
       COUNT(DISTINCT location_id)::int AS location_count,
       MAX(created_at) AS last_active
     FROM profile_events
     WHERE profile_id IS NOT NULL
     GROUP BY profile_id
     ORDER BY event_count DESC`,
    [timeRange.start, timeRange.end],
  );

  return rows.map((r: Record<string, unknown>) => ({
    profileId: r.profile_id as string,
    eventCount: r.event_count as number,
    deviceCount: r.device_count as number,
    locationCount: r.location_count as number,
    lastActive: r.last_active ? new Date(r.last_active as string) : null,
  }));
}

/* ------------------------------------------------------------------ */
/*  Profile event volume — time_bucket for timeline chart             */
/* ------------------------------------------------------------------ */

export async function getProfileEventVolume(
  profileId: string,
  timeRange: TimeRange,
): Promise<EventVolumeBucket[]> {
  const { rows } = await eventsPool.query(
    `SELECT time_bucket($1::interval, created_at) AS bucket,
            event_type,
            COUNT(*)::int AS count
     FROM event_log
     WHERE created_at >= $2 AND created_at <= $3
       AND (
         payload->>'profile_id' = $4
         OR (
           payload->'profile_ids_present' IS NOT NULL
           AND payload->'profile_ids_present' @> to_jsonb($4::text)
         )
         OR primary_profile_id = $4::uuid
       )
     GROUP BY bucket, event_type
     ORDER BY bucket`,
    [timeRange.bucket, timeRange.start, timeRange.end, profileId],
  );

  return rows.map((r: Record<string, unknown>) => ({
    bucket: new Date(r.bucket as string),
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Profile activity breakdown — count per event_type                 */
/* ------------------------------------------------------------------ */

export async function getProfileActivityBreakdown(
  profileId: string,
  timeRange: TimeRange,
): Promise<EventTypeCount[]> {
  const { rows } = await eventsPool.query(
    `SELECT event_type, COUNT(*)::int AS count
     FROM event_log
     WHERE created_at >= $1 AND created_at <= $2
       AND (
         payload->>'profile_id' = $3
         OR (
           payload->'profile_ids_present' IS NOT NULL
           AND payload->'profile_ids_present' @> to_jsonb($3::text)
         )
         OR primary_profile_id = $3::uuid
       )
     GROUP BY event_type
     ORDER BY count DESC`,
    [timeRange.start, timeRange.end, profileId],
  );

  return rows.map((r: Record<string, unknown>) => ({
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Profile events — paginated for the detail event stream            */
/* ------------------------------------------------------------------ */

export interface PaginatedProfileEvents {
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

export async function getProfileEvents(
  profileId: string,
  timeRange: TimeRange,
  limit: number,
  offset: number,
): Promise<PaginatedProfileEvents> {
  const whereClause = `WHERE created_at >= $1 AND created_at <= $2
       AND (
         payload->>'profile_id' = $3
         OR (
           payload->'profile_ids_present' IS NOT NULL
           AND payload->'profile_ids_present' @> to_jsonb($3::text)
         )
         OR primary_profile_id = $3::uuid
       )`;

  const [countResult, dataResult] = await Promise.all([
    eventsPool.query(
      `SELECT COUNT(*)::int AS total FROM event_log ${whereClause}`,
      [timeRange.start, timeRange.end, profileId],
    ),
    eventsPool.query(
      `SELECT * FROM event_log ${whereClause}
       ORDER BY created_at DESC
       LIMIT $4 OFFSET $5`,
      [timeRange.start, timeRange.end, profileId, limit, offset],
    ),
  ]);

  return {
    rows: dataResult.rows.map(mapEventRow),
    total: countResult.rows[0].total as number,
  };
}
