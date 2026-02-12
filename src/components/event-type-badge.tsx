import { Badge } from "@/components/ui/badge";
import { EVENT_TYPE_COLORS } from "@/lib/constants";

interface EventTypeBadgeProps {
  type: string;
  className?: string;
}

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  const color = EVENT_TYPE_COLORS[type] || "#6b7280";
  return (
    <Badge
      className={className}
      style={{ backgroundColor: color, color: "#fff", borderColor: color }}
    >
      {type.replace(/_/g, " ")}
    </Badge>
  );
}
