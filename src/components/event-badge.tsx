import { Badge } from "@/components/ui/badge";
import { getEventColor } from "@/lib/constants";

export function EventBadge({ eventType }: { eventType: string }) {
  const color = getEventColor(eventType);
  return (
    <Badge
      variant="outline"
      className="font-mono text-xs whitespace-nowrap"
      style={{
        borderColor: color,
        color: color,
        backgroundColor: `${color}15`,
      }}
    >
      {eventType}
    </Badge>
  );
}
