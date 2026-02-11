import { Pool } from "pg";

// Two database connections as specified in PRD
const eventsPool = new Pool({
  connectionString: process.env.EVENTS_DATABASE_URL,
  max: 10,
});

const mainPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export async function queryEvents<T>(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T[]> {
  const result = await eventsPool.query(text, params);
  return result.rows as T[];
}

export async function queryMain<T>(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T[]> {
  const result = await mainPool.query(text, params);
  return result.rows as T[];
}

// ── Cached lookups for reference data ──

export interface Profile {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  location_id: string | null;
}

export interface Location {
  id: string;
  display_name: string;
  address: string | null;
  slug: string | null;
}

let profileCache: Map<string, Profile> | null = null;
let deviceCache: Map<string, Device> | null = null;
let locationCache: Map<string, Location> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isCacheStale(): boolean {
  return Date.now() - cacheTimestamp > CACHE_TTL;
}

export async function getProfiles(): Promise<Map<string, Profile>> {
  if (profileCache && !isCacheStale()) return profileCache;
  const rows = await queryMain<{
    id: string;
    name: string | null;
    avatar: string | null;
  }>("SELECT id, metadata -> 'name' AS name, avatar FROM profile");
  profileCache = new Map();
  for (const row of rows) {
    profileCache.set(row.id, {
      id: row.id,
      name: row.name || "Unknown",
      avatar: row.avatar,
    });
  }
  cacheTimestamp = Date.now();
  return profileCache;
}

export async function getDevices(): Promise<Map<string, Device>> {
  if (deviceCache && !isCacheStale()) return deviceCache;
  const rows = await queryMain<Device>(
    "SELECT id, name, type, location_id FROM device"
  );
  deviceCache = new Map();
  for (const row of rows) {
    deviceCache.set(row.id, row);
  }
  cacheTimestamp = Date.now();
  return deviceCache;
}

export async function getLocations(): Promise<Map<string, Location>> {
  if (locationCache && !isCacheStale()) return locationCache;
  const rows = await queryMain<Location>(
    "SELECT id, display_name, address, slug FROM location"
  );
  locationCache = new Map();
  for (const row of rows) {
    locationCache.set(row.id, row);
  }
  cacheTimestamp = Date.now();
  return locationCache;
}

export function getProfileName(
  profiles: Map<string, Profile>,
  id: string | null
): string {
  if (!id) return "Unknown";
  return profiles.get(id)?.name || id.slice(0, 8);
}

export function getDeviceName(
  devices: Map<string, Device>,
  id: string | null
): string {
  if (!id) return "Unknown";
  return devices.get(id)?.name || id.slice(0, 8);
}

export function getLocationName(
  locations: Map<string, Location>,
  id: string | null
): string {
  if (!id) return "Unknown";
  return locations.get(id)?.display_name || id.slice(0, 8);
}
