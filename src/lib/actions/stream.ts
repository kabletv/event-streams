"use server";

import { getStreamEvents } from "@/lib/queries/events";
import type { PaginatedEvents, StreamFilters } from "@/lib/queries/types";

export async function fetchStreamEvents(
  limit: number,
  offset: number,
  filters?: StreamFilters,
): Promise<PaginatedEvents> {
  return getStreamEvents(limit, offset, filters);
}
