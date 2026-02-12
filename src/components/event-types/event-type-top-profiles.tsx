import Link from "next/link";
import { User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TopProfileRow } from "@/lib/queries/event-types";
import type { Profile } from "@/lib/queries/types";

interface EventTypeTopProfilesProps {
  data: TopProfileRow[];
  profiles: Profile[];
}

export function EventTypeTopProfiles({ data, profiles }: EventTypeTopProfilesProps) {
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Associated Profiles</CardTitle>
        <CardDescription>
          {data.length} profile{data.length !== 1 ? "s" : ""} involved with this event type
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No profiles associated with this event type.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const profile = profileMap.get(row.profileId);

                  return (
                    <TableRow key={row.profileId} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/profiles/${row.profileId}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="font-medium">
                            {profile?.displayName ?? row.profileId.slice(0, 12) + "…"}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
