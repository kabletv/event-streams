import {
  Activity,
  Gauge,
  Monitor,
  Users,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKPIStats } from "@/lib/queries";
import type { TimeRange } from "@/lib/time-range";

interface KPICardsProps {
  timeRange: TimeRange;
}

const kpiConfig = [
  { key: "totalEvents" as const, label: "Total Events", icon: Activity },
  { key: "eventsPerMinute" as const, label: "Events / Min", icon: Gauge },
  { key: "uniqueDevices" as const, label: "Active Devices", icon: Monitor },
  { key: "uniqueProfiles" as const, label: "Active Profiles", icon: Users },
  { key: "uniqueLocations" as const, label: "Active Locations", icon: MapPin },
];

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export async function KPICards({ timeRange }: KPICardsProps) {
  const stats = await getKPIStats(timeRange);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpiConfig.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats[key])}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
