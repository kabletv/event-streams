import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventTypeCounts } from "@/lib/queries";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import type { TimeRange } from "@/lib/time-range";
import { EventTypeBreakdownChart } from "./event-type-breakdown-chart";

interface EventTypeBreakdownSectionProps {
  timeRange: TimeRange;
}

/**
 * Server component that fetches event type counts and passes them to the
 * client-side bar chart. Already sorted by count DESC from the query layer.
 */
export async function EventTypeBreakdownSection({
  timeRange,
}: EventTypeBreakdownSectionProps) {
  const counts = await getEventTypeCounts(timeRange);

  const data = counts.map((row) => ({
    eventType: row.eventType,
    count: row.count,
    fill: EVENT_TYPE_COLORS[row.eventType] ?? "#9ca3af",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Type Breakdown</CardTitle>
        <CardDescription>
          Count by event type — click a bar to drill down
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EventTypeBreakdownChart data={data} />
      </CardContent>
    </Card>
  );
}
