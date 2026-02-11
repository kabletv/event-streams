// Fixed color palette for event types — consistent across all charts
export const EVENT_TYPE_COLORS: Record<string, string> = {
  user_utterance: "#60a5fa", // blue-400
  assistant_response: "#34d399", // emerald-400
  video_caption: "#f472b6", // pink-400
  assistant_tool_call: "#a78bfa", // violet-400
  session_status: "#fbbf24", // amber-400
  profile_identified: "#fb923c", // orange-400
  profile_presence: "#f87171", // red-400
  protocol_created: "#2dd4bf", // teal-400
  protocol_updated: "#38bdf8", // sky-400
  protocol_deleted: "#e879f9", // fuchsia-400
  metric_alert: "#ef4444", // red-500
  span_ended: "#94a3b8", // slate-400
  proactive_notify: "#facc15", // yellow-400
  background_task_completed: "#4ade80", // green-400
  device_started: "#818cf8", // indigo-400
  mobile_location_update: "#fb7185", // rose-400
  mobile_health_update: "#22d3ee", // cyan-400
  processing_state: "#a3e635", // lime-400
  audio_classification: "#c084fc", // purple-400
  new_person_track: "#f97316", // orange-500
  video_pipeline_online: "#14b8a6", // teal-500
  visual_attention_state: "#ec4899", // pink-500
  doorbell_ring: "#eab308", // yellow-500
  conversation_session: "#6366f1", // indigo-500
  fall_detected: "#dc2626", // red-600
  playback_started: "#8b5cf6", // violet-500
  playback_completed: "#7c3aed", // violet-600
};

export function getEventColor(eventType: string): string {
  return EVENT_TYPE_COLORS[eventType] || "#6b7280"; // gray-500 fallback
}

export const TIME_RANGES = [
  { label: "1h", value: "1h", hours: 1 },
  { label: "6h", value: "6h", hours: 6 },
  { label: "24h", value: "24h", hours: 24 },
  { label: "7d", value: "7d", hours: 168 },
  { label: "30d", value: "30d", hours: 720 },
] as const;

export type TimeRangeValue = (typeof TIME_RANGES)[number]["value"];

export function getHoursFromRange(range: string): number {
  const found = TIME_RANGES.find((r) => r.value === range);
  return found ? found.hours : 24;
}

export function getBucketInterval(hours: number): string {
  if (hours <= 1) return "1 minute";
  if (hours <= 6) return "5 minutes";
  if (hours <= 24) return "15 minutes";
  if (hours <= 168) return "1 hour";
  return "6 hours";
}
