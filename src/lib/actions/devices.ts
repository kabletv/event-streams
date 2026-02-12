"use server";

import { getDeviceEvents, type PaginatedDeviceEvents } from "@/lib/queries/devices";
import { parseTimeRange } from "@/lib/time-range";

export async function fetchDeviceEvents(
  deviceId: string,
  range: string,
  limit: number,
  offset: number,
): Promise<PaginatedDeviceEvents> {
  const timeRange = parseTimeRange(range);
  return getDeviceEvents(deviceId, timeRange, limit, offset);
}
