"use server";

import {
  getLocationEvents,
  type PaginatedLocationEvents,
} from "@/lib/queries/locations";
import { parseTimeRange } from "@/lib/time-range";

export async function fetchLocationEvents(
  locationId: string,
  range: string,
  limit: number,
  offset: number,
): Promise<PaginatedLocationEvents> {
  const timeRange = parseTimeRange(range);
  return getLocationEvents(locationId, timeRange, limit, offset);
}
