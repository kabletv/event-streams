import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProfiles } from "@/lib/queries/reference";
import { getProfileEventStats } from "@/lib/queries/profiles";
import type { TimeRange } from "@/lib/time-range";
import type { Profile } from "@/lib/queries/types";
import type { ProfileEventStats } from "@/lib/queries/profiles";

interface ProfilesTableProps {
  timeRange: TimeRange;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

interface ProfileRowData {
  profile: Profile;
  stats: ProfileEventStats | null;
}

export async function ProfilesTable({ timeRange }: ProfilesTableProps) {
  const [profiles, statsArr] = await Promise.all([
    getProfiles(),
    getProfileEventStats(timeRange),
  ]);

  // Build a map of profileId → stats
  const statsMap = new Map(statsArr.map((s) => [s.profileId, s]));

  // Merge profiles with stats, sort by event count desc
  const rows: ProfileRowData[] = profiles
    .map((profile) => ({
      profile,
      stats: statsMap.get(profile.id) ?? null,
    }))
    .sort((a, b) => (b.stats?.eventCount ?? 0) - (a.stats?.eventCount ?? 0));

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No profiles found
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Profiles will appear here once registered.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
            <TableHead className="text-right">Events</TableHead>
            <TableHead className="text-right">Devices</TableHead>
            <TableHead className="text-right">Locations</TableHead>
            <TableHead>Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ profile, stats }) => (
            <TableRow key={profile.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell>
                <Link
                  href={`/profiles/${profile.id}`}
                  className="font-medium hover:underline"
                >
                  {profile.displayName ?? profile.id.slice(0, 12) + "…"}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {stats ? stats.eventCount.toLocaleString() : "0"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {stats ? stats.deviceCount.toLocaleString() : "0"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {stats ? stats.locationCount.toLocaleString() : "0"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {stats?.lastActive
                  ? formatRelativeTime(stats.lastActive)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
