"use server";

import { parseTimeRange } from "@/lib/time-range";
import { getEventTypeSamplePayloads } from "@/lib/queries/event-types";
import type { EventRow } from "@/lib/queries/types";

export async function loadMoreSamplePayloads(
  eventType: string,
  range: string,
  offset: number,
  limit = 10,
): Promise<EventRow[]> {
  const timeRange = parseTimeRange(range);
  return getEventTypeSamplePayloads(eventType, timeRange, limit, offset);
}
