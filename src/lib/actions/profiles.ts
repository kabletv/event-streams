"use server";

import {
  getProfileEvents,
  type PaginatedProfileEvents,
} from "@/lib/queries/profiles";
import { parseTimeRange } from "@/lib/time-range";

export async function fetchProfileEvents(
  profileId: string,
  range: string,
  limit: number,
  offset: number,
): Promise<PaginatedProfileEvents> {
  const timeRange = parseTimeRange(range);
  return getProfileEvents(profileId, timeRange, limit, offset);
}
