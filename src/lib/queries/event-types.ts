import { eventsPool } from "@/lib/db";
import type { TimeRange } from "@/lib/time-range";
import type { EventVolumeBucket, EventRow } from "./types";

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
/*  Event type total count                                            */
/* ------------------------------------------------------------------ */

export async function getEventTypeTotal(
  eventType: string,
  timeRange: TimeRange,
): Promise<number> {
  const { rows } = await eventsPool.query(
    `SELECT COUNT(*)::int AS total
     FROM event_log
     WHERE event_type = $1 AND created_at >= $2 AND created_at <= $3`,
    [eventType, timeRange.start, timeRange.end],
  );
  return (rows[0]?.total as number) ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Volume over time — time_bucket for line chart                     */
/* ------------------------------------------------------------------ */

export async function getEventTypeVolume(
  eventType: string,
  timeRange: TimeRange,
): Promise<EventVolumeBucket[]> {
  const { rows } = await eventsPool.query(
    `SELECT time_bucket($1::interval, created_at) AS bucket,
            event_type,
            COUNT(*)::int AS count
     FROM event_log
     WHERE event_type = $2 AND created_at >= $3 AND created_at <= $4
     GROUP BY bucket, event_type
     ORDER BY bucket`,
    [timeRange.bucket, eventType, timeRange.start, timeRange.end],
  );
  return rows.map((r: Record<string, unknown>) => ({
    bucket: new Date(r.bucket as string),
    eventType: r.event_type as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Top devices emitting this event type                              */
/* ------------------------------------------------------------------ */

export interface TopDeviceRow {
  deviceId: string;
  count: number;
}

export async function getEventTypeTopDevices(
  eventType: string,
  timeRange: TimeRange,
  limit = 10,
): Promise<TopDeviceRow[]> {
  const { rows } = await eventsPool.query(
    `SELECT device_id, COUNT(*)::int AS count
     FROM event_log
     WHERE event_type = $1 AND created_at >= $2 AND created_at <= $3
       AND device_id IS NOT NULL
     GROUP BY device_id
     ORDER BY count DESC
     LIMIT $4`,
    [eventType, timeRange.start, timeRange.end, limit],
  );
  return rows.map((r: Record<string, unknown>) => ({
    deviceId: r.device_id as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Associated profiles                                               */
/* ------------------------------------------------------------------ */

export interface TopProfileRow {
  profileId: string;
  count: number;
}

export async function getEventTypeTopProfiles(
  eventType: string,
  timeRange: TimeRange,
  limit = 10,
): Promise<TopProfileRow[]> {
  const { rows } = await eventsPool.query(
    `WITH profile_events AS (
       SELECT COALESCE(primary_profile_id::text, payload->>'profile_id') AS profile_id
       FROM event_log
       WHERE event_type = $1 AND created_at >= $2 AND created_at <= $3
         AND (primary_profile_id IS NOT NULL OR payload->>'profile_id' IS NOT NULL)
       UNION ALL
       SELECT jsonb_array_elements_text(payload->'profile_ids_present') AS profile_id
       FROM event_log
       WHERE event_type = $1 AND created_at >= $2 AND created_at <= $3
         AND payload->'profile_ids_present' IS NOT NULL
     )
     SELECT profile_id, COUNT(*)::int AS count
     FROM profile_events
     WHERE profile_id IS NOT NULL
     GROUP BY profile_id
     ORDER BY count DESC
     LIMIT $4`,
    [eventType, timeRange.start, timeRange.end, limit],
  );
  return rows.map((r: Record<string, unknown>) => ({
    profileId: r.profile_id as string,
    count: r.count as number,
  }));
}

/* ------------------------------------------------------------------ */
/*  Sample recent payloads                                            */
/* ------------------------------------------------------------------ */

export async function getEventTypeSamplePayloads(
  eventType: string,
  timeRange: TimeRange,
  limit = 10,
  offset = 0,
): Promise<EventRow[]> {
  const { rows } = await eventsPool.query(
    `SELECT id, created_at, event_type, device_id, location_id,
            primary_profile_id, payload
     FROM event_log
     WHERE event_type = $1 AND created_at >= $2 AND created_at <= $3
     ORDER BY created_at DESC
     LIMIT $4 OFFSET $5`,
    [eventType, timeRange.start, timeRange.end, limit, offset],
  );
  return rows.map(mapEventRow);
}
