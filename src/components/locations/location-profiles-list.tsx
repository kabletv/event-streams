import Link from "next/link";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Profile } from "@/lib/queries/types";

interface LocationProfilesListProps {
  profiles: Profile[];
}

export function LocationProfilesList({ profiles }: LocationProfilesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profiles at this Location</CardTitle>
        <CardDescription>
          {profiles.length} profile{profiles.length !== 1 ? "s" : ""} associated
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profiles.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No profiles associated with this location.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/profiles/${profile.id}`}
                className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {profile.displayName ?? profile.id.slice(0, 12) + "…"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {profile.id.slice(0, 12)}…
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
