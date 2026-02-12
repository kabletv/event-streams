import { mainPool } from "@/lib/db";
import type { Profile, Device, Location } from "./types";

/* ------------------------------------------------------------------ */
/*  In-memory cache with TTL                                          */
/* ------------------------------------------------------------------ */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): T {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

/* ------------------------------------------------------------------ */
/*  Profiles                                                          */
/* ------------------------------------------------------------------ */

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    displayName: (row.display_name as string) ?? null,
    metadata: (row.metadata as Record<string, string>) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getProfiles(): Promise<Profile[]> {
  const cached = getCached<Profile[]>("profiles:all");
  if (cached) return cached;

  const { rows } = await mainPool.query(
    `SELECT id, metadata->'name' AS display_name, metadata, created_at, updated_at
     FROM profile
     ORDER BY metadata->'name' NULLS LAST`,
  );
  return setCache("profiles:all", rows.map(mapProfile));
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const cacheKey = `profile:${id}`;
  const cached = getCached<Profile>(cacheKey);
  if (cached) return cached;

  const { rows } = await mainPool.query(
    `SELECT id, metadata->'name' AS display_name, metadata, created_at, updated_at
     FROM profile
     WHERE id = $1`,
    [id],
  );
  if (rows.length === 0) return null;
  return setCache(cacheKey, mapProfile(rows[0]));
}

/* ------------------------------------------------------------------ */
/*  Devices                                                           */
/* ------------------------------------------------------------------ */

function mapDevice(row: Record<string, unknown>): Device {
  return {
    id: row.id as string,
    name: (row.name as string) ?? null,
    deviceType: (row.device_type as string) ?? null,
    locationId: (row.location_id as string) ?? null,
    locationName: (row.location_name as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getDevices(): Promise<Device[]> {
  const cached = getCached<Device[]>("devices:all");
  if (cached) return cached;

  const { rows } = await mainPool.query(
    `SELECT d.id, d.name, d.type AS device_type, d.location_id,
            l.display_name AS location_name,
            d.created_at, d.updated_at
     FROM device d
     LEFT JOIN location l ON l.id = d.location_id
     ORDER BY d.name NULLS LAST`,
  );
  return setCache("devices:all", rows.map(mapDevice));
}

export async function getDeviceById(id: string): Promise<Device | null> {
  const cacheKey = `device:${id}`;
  const cached = getCached<Device>(cacheKey);
  if (cached) return cached;

  const { rows } = await mainPool.query(
    `SELECT d.id, d.name, d.type AS device_type, d.location_id,
            l.display_name AS location_name,
            d.created_at, d.updated_at
     FROM device d
     LEFT JOIN location l ON l.id = d.location_id
     WHERE d.id = $1`,
    [id],
  );
  if (rows.length === 0) return null;
  return setCache(cacheKey, mapDevice(rows[0]));
}

/* ------------------------------------------------------------------ */
/*  Locations                                                         */
/* ------------------------------------------------------------------ */

function mapLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    name: row.name as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getLocations(): Promise<Location[]> {
  const cached = getCached<Location[]>("locations:all");
  if (cached) return cached;

  const { rows } = await mainPool.query(
    `SELECT id, display_name AS name, created_at, updated_at
     FROM location
     ORDER BY display_name`,
  );
  return setCache("locations:all", rows.map(mapLocation));
}

export async function getLocationById(id: string): Promise<Location | null> {
  const cacheKey = `location:${id}`;
  const cached = getCached<Location>(cacheKey);
  if (cached) return cached;

  const { rows } = await mainPool.query(
    `SELECT id, display_name AS name, created_at, updated_at
     FROM location
     WHERE id = $1`,
    [id],
  );
  if (rows.length === 0) return null;
  return setCache(cacheKey, mapLocation(rows[0]));
}

/** Get profiles associated with a location (via devices at that location) */
export async function getLocationProfiles(
  locationId: string,
): Promise<Profile[]> {
  const cacheKey = `location-profiles:${locationId}`;
  const cached = getCached<Profile[]>(cacheKey);
  if (cached) return cached;

  const { rows } = await mainPool.query(
    `SELECT DISTINCT p.id, metadata->'name' AS display_name, p.metadata,
            p.created_at, p.updated_at
     FROM profile p
     JOIN locations_profiles pl ON pl.profile_id = p.id
     WHERE pl.location_id = $1
     ORDER BY metadata->'name' NULLS LAST`,
    [locationId],
  );
  return setCache(cacheKey, rows.map(mapProfile));
}

/* ------------------------------------------------------------------ */
/*  Name resolution helpers                                           */
/* ------------------------------------------------------------------ */

export async function resolveDeviceName(id: string): Promise<string> {
  const device = await getDeviceById(id);
  return device?.name ?? id;
}

export async function resolveProfileName(id: string): Promise<string> {
  const profile = await getProfileById(id);
  return profile?.displayName ?? id;
}

export async function resolveLocationName(id: string): Promise<string> {
  const location = await getLocationById(id);
  return location?.name ?? id;
}
