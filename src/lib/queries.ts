import { queryEvents } from "./db";
import { getBucketInterval } from "./constants";

// ── Overview KPIs ──

export interface KPIs {
  totalEvents: number;
  eventsPerMinute: number;
  uniqueDevices: number;
  uniqueProfiles: number;
  uniqueLocations: number;
}

export async function getKPIs(hours: number): Promise<KPIs> {
  const [totals] = await queryEvents<{
    total: string;
    epm: string;
    devices: string;
    locations: string;
  }>(
    `SELECT
      COUNT(*)::text AS total,
      (COUNT(*) / GREATEST(EXTRACT(EPOCH FROM (NOW() - (NOW() - $1::interval))) / 60, 1))::numeric(10,2)::text AS epm,
      COUNT(DISTINCT device_id)::text AS devices,
      COUNT(DISTINCT location_id)::text AS locations
    FROM event_log
    WHERE created_at >= NOW() - $1::interval`,
    [`${hours} hours`]
  );

  // Profile count from payload extraction (including array-based profile_ids_present)
  const [profileCount] = await queryEvents<{ profiles: string }>(
    `SELECT COUNT(DISTINCT resolved) AS profiles FROM (
      SELECT COALESCE(primary_profile_id::text, payload->>'profile_id') AS resolved
      FROM event_log
      WHERE created_at >= NOW() - $1::interval
        AND (primary_profile_id IS NOT NULL OR payload->>'profile_id' IS NOT NULL)
      UNION
      SELECT jsonb_array_elements_text(payload->'profile_ids_present') AS resolved
      FROM event_log
      WHERE created_at >= NOW() - $1::interval
        AND payload ? 'profile_ids_present'
    ) sub WHERE resolved IS NOT NULL`,
    [`${hours} hours`]
  );

  return {
    totalEvents: parseInt(totals.total, 10),
    eventsPerMinute: parseFloat(totals.epm),
    uniqueDevices: parseInt(totals.devices, 10),
    uniqueProfiles: parseInt(profileCount?.profiles || "0", 10),
    uniqueLocations: parseInt(totals.locations, 10),
  };
}

// ── Time-series volume ──

export interface TimeSeriesPoint {
  bucket: string;
  event_type: string;
  count: number;
}

export async function getTimeSeries(
  hours: number
): Promise<TimeSeriesPoint[]> {
  const bucket = getBucketInterval(hours);
  return queryEvents<TimeSeriesPoint>(
    `SELECT
      time_bucket($1::interval, created_at)::text AS bucket,
      event_type,
      COUNT(*)::int AS count
    FROM event_log
    WHERE created_at >= NOW() - $2::interval
    GROUP BY 1, event_type
    ORDER BY 1`,
    [bucket, `${hours} hours`]
  );
}

// ── Event type breakdown ──

export interface EventTypeCount {
  event_type: string;
  count: number;
}

export async function getEventTypeBreakdown(
  hours: number
): Promise<EventTypeCount[]> {
  return queryEvents<EventTypeCount>(
    `SELECT event_type, COUNT(*)::int AS count
    FROM event_log
    WHERE created_at >= NOW() - $1::interval
    GROUP BY event_type
    ORDER BY count DESC`,
    [`${hours} hours`]
  );
}

// ── Devices ──

export interface DeviceRow {
  device_id: string;
  total_events: number;
  last_event: string;
  top_types: string[];
}

export async function getDeviceStats(hours: number): Promise<DeviceRow[]> {
  return queryEvents<DeviceRow>(
    `SELECT
      device_id,
      COUNT(*)::int AS total_events,
      MAX(created_at)::text AS last_event,
      (SELECT array_agg(et) FROM (
        SELECT event_type AS et FROM event_log e2
        WHERE e2.device_id = e.device_id AND e2.created_at >= NOW() - $1::interval
        GROUP BY event_type ORDER BY COUNT(*) DESC LIMIT 3
      ) sub) AS top_types
    FROM event_log e
    WHERE created_at >= NOW() - $1::interval AND device_id IS NOT NULL
    GROUP BY device_id
    ORDER BY total_events DESC`,
    [`${hours} hours`]
  );
}

export interface DeviceEvent {
  id: string;
  created_at: string;
  event_type: string;
  payload: Record<string, unknown>;
}

export async function getDeviceEvents(
  deviceId: string,
  hours: number,
  limit: number = 100
): Promise<DeviceEvent[]> {
  return queryEvents<DeviceEvent>(
    `SELECT id::text, created_at::text, event_type, payload
    FROM event_log
    WHERE device_id = $1 AND created_at >= NOW() - $2::interval
    ORDER BY created_at DESC
    LIMIT $3`,
    [deviceId, `${hours} hours`, limit]
  );
}

export async function getDeviceTimeSeries(
  deviceId: string,
  hours: number
): Promise<TimeSeriesPoint[]> {
  const bucket = getBucketInterval(hours);
  return queryEvents<TimeSeriesPoint>(
    `SELECT
      time_bucket($1::interval, created_at)::text AS bucket,
      event_type,
      COUNT(*)::int AS count
    FROM event_log
    WHERE device_id = $2 AND created_at >= NOW() - $3::interval
    GROUP BY 1, event_type
    ORDER BY 1`,
    [bucket, deviceId, `${hours} hours`]
  );
}

// ── Profiles ──

export interface ProfileRow {
  profile_id: string;
  event_count: number;
  distinct_devices: number;
  distinct_locations: number;
  last_active: string;
}

export async function getProfileStats(hours: number): Promise<ProfileRow[]> {
  return queryEvents<ProfileRow>(
    `SELECT
      resolved AS profile_id,
      COUNT(*)::int AS event_count,
      COUNT(DISTINCT device_id)::int AS distinct_devices,
      COUNT(DISTINCT location_id)::int AS distinct_locations,
      MAX(created_at)::text AS last_active
    FROM (
      SELECT
        COALESCE(primary_profile_id::text, payload->>'profile_id') AS resolved,
        device_id,
        location_id,
        created_at
      FROM event_log
      WHERE created_at >= NOW() - $1::interval
        AND (primary_profile_id IS NOT NULL OR payload->>'profile_id' IS NOT NULL)
      UNION ALL
      SELECT
        jsonb_array_elements_text(payload->'profile_ids_present') AS resolved,
        device_id,
        location_id,
        created_at
      FROM event_log
      WHERE created_at >= NOW() - $1::interval
        AND payload ? 'profile_ids_present'
    ) sub
    WHERE resolved IS NOT NULL
    GROUP BY resolved
    ORDER BY event_count DESC`,
    [`${hours} hours`]
  );
}

export async function getProfileEvents(
  profileId: string,
  hours: number,
  limit: number = 100
): Promise<DeviceEvent[]> {
  return queryEvents<DeviceEvent>(
    `SELECT id::text, created_at::text, event_type, payload
    FROM event_log
    WHERE (
      primary_profile_id::text = $1
      OR payload->>'profile_id' = $1
      OR (payload ? 'profile_ids_present' AND payload->'profile_ids_present' @> to_jsonb($1::text))
    )
      AND created_at >= NOW() - $2::interval
    ORDER BY created_at DESC
    LIMIT $3`,
    [profileId, `${hours} hours`, limit]
  );
}

export async function getProfileTimeSeries(
  profileId: string,
  hours: number
): Promise<TimeSeriesPoint[]> {
  const bucket = getBucketInterval(hours);
  return queryEvents<TimeSeriesPoint>(
    `SELECT
      time_bucket($1::interval, created_at)::text AS bucket,
      event_type,
      COUNT(*)::int AS count
    FROM event_log
    WHERE (
      primary_profile_id::text = $2
      OR payload->>'profile_id' = $2
      OR (payload ? 'profile_ids_present' AND payload->'profile_ids_present' @> to_jsonb($2::text))
    )
      AND created_at >= NOW() - $3::interval
    GROUP BY 1, event_type
    ORDER BY 1`,
    [bucket, profileId, `${hours} hours`]
  );
}

// ── Locations ──

export interface LocationRow {
  location_id: string;
  device_count: number;
  profile_count: number;
  total_events: number;
  sparkline: { bucket: string; count: number }[];
}

export async function getLocationStats(
  hours: number
): Promise<LocationRow[]> {
  const rows = await queryEvents<{
    location_id: string;
    device_count: string;
    profile_count: string;
    total_events: string;
  }>(
    `SELECT
      location_id,
      COUNT(DISTINCT device_id)::text AS device_count,
      COUNT(DISTINCT COALESCE(primary_profile_id::text, payload->>'profile_id'))::text AS profile_count,
      COUNT(*)::text AS total_events
    FROM event_log
    WHERE created_at >= NOW() - $1::interval AND location_id IS NOT NULL
    GROUP BY location_id
    ORDER BY total_events DESC`,
    [`${hours} hours`]
  );

  // Get sparkline data for each location
  const bucket = getBucketInterval(hours);
  const sparklines = await queryEvents<{
    location_id: string;
    bucket: string;
    count: string;
  }>(
    `SELECT
      location_id,
      time_bucket($1::interval, created_at)::text AS bucket,
      COUNT(*)::text AS count
    FROM event_log
    WHERE created_at >= NOW() - $2::interval AND location_id IS NOT NULL
    GROUP BY location_id, 1
    ORDER BY location_id, 1`,
    [bucket, `${hours} hours`]
  );

  const sparklineMap = new Map<
    string,
    { bucket: string; count: number }[]
  >();
  for (const s of sparklines) {
    if (!sparklineMap.has(s.location_id)) {
      sparklineMap.set(s.location_id, []);
    }
    sparklineMap.get(s.location_id)!.push({
      bucket: s.bucket,
      count: parseInt(s.count, 10),
    });
  }

  return rows.map((r) => ({
    location_id: r.location_id,
    device_count: parseInt(r.device_count, 10),
    profile_count: parseInt(r.profile_count, 10),
    total_events: parseInt(r.total_events, 10),
    sparkline: sparklineMap.get(r.location_id) || [],
  }));
}

export async function getLocationEvents(
  locationId: string,
  hours: number,
  limit: number = 100
): Promise<DeviceEvent[]> {
  return queryEvents<DeviceEvent>(
    `SELECT id::text, created_at::text, event_type, payload
    FROM event_log
    WHERE location_id = $1 AND created_at >= NOW() - $2::interval
    ORDER BY created_at DESC
    LIMIT $3`,
    [locationId, `${hours} hours`, limit]
  );
}

export async function getLocationTimeSeries(
  locationId: string,
  hours: number
): Promise<TimeSeriesPoint[]> {
  const bucket = getBucketInterval(hours);
  return queryEvents<TimeSeriesPoint>(
    `SELECT
      time_bucket($1::interval, created_at)::text AS bucket,
      event_type,
      COUNT(*)::int AS count
    FROM event_log
    WHERE location_id = $2 AND created_at >= NOW() - $3::interval
    GROUP BY 1, event_type
    ORDER BY 1`,
    [bucket, locationId, `${hours} hours`]
  );
}

// ── Activity Stream ──

export interface StreamEvent {
  id: string;
  created_at: string;
  event_type: string;
  device_id: string | null;
  location_id: string | null;
  primary_profile_id: string | null;
  payload: Record<string, unknown>;
  resolved_profile_id: string | null;
}

export async function getStreamEvents(
  hours: number,
  limit: number = 50,
  offset: number = 0,
  eventTypes?: string[],
  deviceId?: string,
  profileId?: string,
  locationId?: string
): Promise<StreamEvent[]> {
  const conditions: string[] = ["created_at >= NOW() - $1::interval"];
  const params: (string | number)[] = [`${hours} hours`];
  let paramIdx = 2;

  if (eventTypes && eventTypes.length > 0) {
    conditions.push(`event_type = ANY($${paramIdx})`);
    params.push(eventTypes as unknown as string);
    paramIdx++;
  }

  if (deviceId) {
    conditions.push(`device_id = $${paramIdx}::uuid`);
    params.push(deviceId);
    paramIdx++;
  }

  if (locationId) {
    conditions.push(`location_id = $${paramIdx}::uuid`);
    params.push(locationId);
    paramIdx++;
  }

  const profileCondition = profileId
    ? `AND (primary_profile_id::text = $${paramIdx} OR payload->>'profile_id' = $${paramIdx} OR (payload ? 'profile_ids_present' AND payload->'profile_ids_present' @> to_jsonb($${paramIdx}::text)))`
    : "";
  if (profileId) {
    params.push(profileId);
    paramIdx++;
  }

  params.push(limit, offset);

  return queryEvents<StreamEvent>(
    `SELECT
      id::text,
      created_at::text,
      event_type,
      device_id::text,
      location_id::text,
      primary_profile_id::text,
      payload,
      COALESCE(
        primary_profile_id::text,
        payload->>'profile_id',
        (SELECT jsonb_array_elements_text(payload->'profile_ids_present') LIMIT 1)
      ) AS resolved_profile_id
    FROM event_log
    WHERE ${conditions.join(" AND ")} ${profileCondition}
    ORDER BY created_at DESC
    LIMIT $${paramIdx - 1} OFFSET $${paramIdx}`,
    params
  );
}

// ── Event Type Explorer ──

export async function getEventTypeDetails(eventType: string, hours: number) {
  const [volumePromise, topDevicesPromise, topProfilesPromise, samplesPromise] =
    await Promise.all([
      queryEvents<TimeSeriesPoint>(
        `SELECT
          time_bucket($1::interval, created_at)::text AS bucket,
          event_type,
          COUNT(*)::int AS count
        FROM event_log
        WHERE event_type = $2 AND created_at >= NOW() - $3::interval
        GROUP BY 1, event_type
        ORDER BY 1`,
        [getBucketInterval(hours), eventType, `${hours} hours`]
      ),
      queryEvents<{ device_id: string; count: number }>(
        `SELECT device_id::text, COUNT(*)::int AS count
        FROM event_log
        WHERE event_type = $1 AND created_at >= NOW() - $2::interval AND device_id IS NOT NULL
        GROUP BY device_id
        ORDER BY count DESC
        LIMIT 10`,
        [eventType, `${hours} hours`]
      ),
      queryEvents<{ profile_id: string; count: number }>(
        `SELECT profile_id, COUNT(*)::int AS count FROM (
          SELECT COALESCE(primary_profile_id::text, payload->>'profile_id') AS profile_id
          FROM event_log
          WHERE event_type = $1 AND created_at >= NOW() - $2::interval
            AND (primary_profile_id IS NOT NULL OR payload->>'profile_id' IS NOT NULL)
          UNION ALL
          SELECT jsonb_array_elements_text(payload->'profile_ids_present') AS profile_id
          FROM event_log
          WHERE event_type = $1 AND created_at >= NOW() - $2::interval
            AND payload ? 'profile_ids_present'
        ) sub
        WHERE profile_id IS NOT NULL
        GROUP BY profile_id
        ORDER BY count DESC
        LIMIT 10`,
        [eventType, `${hours} hours`]
      ),
      queryEvents<DeviceEvent>(
        `SELECT id::text, created_at::text, event_type, payload
        FROM event_log
        WHERE event_type = $1 AND created_at >= NOW() - $2::interval
        ORDER BY created_at DESC
        LIMIT 10`,
        [eventType, `${hours} hours`]
      ),
    ]);

  return {
    volume: volumePromise,
    topDevices: topDevicesPromise,
    topProfiles: topProfilesPromise,
    samples: samplesPromise,
  };
}

// ── Distinct event types (for filter dropdowns) ──

export async function getDistinctEventTypes(
  hours: number
): Promise<string[]> {
  const rows = await queryEvents<{ event_type: string }>(
    `SELECT DISTINCT event_type
    FROM event_log
    WHERE created_at >= NOW() - $1::interval
    ORDER BY event_type`,
    [`${hours} hours`]
  );
  return rows.map((r) => r.event_type);
}
