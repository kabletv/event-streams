export interface TimeRange {
  start: Date;
  end: Date;
  bucket: string;
  label: string;
}

const RANGE_CONFIG: Record<string, { ms: number; bucket: string; label: string }> = {
  "1h": { ms: 60 * 60 * 1000, bucket: "1 minute", label: "Last hour" },
  "6h": { ms: 6 * 60 * 60 * 1000, bucket: "5 minutes", label: "Last 6 hours" },
  "24h": { ms: 24 * 60 * 60 * 1000, bucket: "1 hour", label: "Last 24 hours" },
  "7d": { ms: 7 * 24 * 60 * 60 * 1000, bucket: "6 hours", label: "Last 7 days" },
  "30d": { ms: 30 * 24 * 60 * 60 * 1000, bucket: "1 day", label: "Last 30 days" },
};

const DEFAULT_RANGE = "24h";

/**
 * Parse a range string (e.g. "1h", "6h", "24h", "7d", "30d") into a TimeRange.
 * Defaults to "24h" for unrecognized or missing values.
 */
export function parseTimeRange(range?: string | null): TimeRange {
  const key = range && range in RANGE_CONFIG ? range : DEFAULT_RANGE;
  const config = RANGE_CONFIG[key];
  const end = new Date();
  const start = new Date(end.getTime() - config.ms);
  return { start, end, bucket: config.bucket, label: config.label };
}

/**
 * Extract the time range from URL search params.
 */
export function timeRangeFromParams(
  searchParams: Record<string, string | string[] | undefined>,
): TimeRange {
  const raw = searchParams.range;
  const range = Array.isArray(raw) ? raw[0] : raw;
  return parseTimeRange(range);
}

/** All valid range keys for UI selectors */
export const RANGE_OPTIONS = Object.entries(RANGE_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));
