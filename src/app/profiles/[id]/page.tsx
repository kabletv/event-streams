import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { timeRangeFromParams } from "@/lib/time-range";
import { TimeRangeSelector } from "@/components/time-range-selector";
import { getProfileById, getDevices } from "@/lib/queries/reference";
import {
  getProfileEventVolume,
  getProfileActivityBreakdown,
  getProfileEvents,
} from "@/lib/queries/profiles";
import { ProfileActivityChart } from "@/components/profiles/profile-activity-chart";
import { ProfileTimelineChart } from "@/components/profiles/profile-timeline-chart";
import { ProfileEventStream } from "@/components/profiles/profile-event-stream";
import { ChartSkeleton } from "@/components/overview/skeletons";
import { ProfilesTableSkeleton } from "@/components/profiles/skeletons";

const PAGE_SIZE = 50;

interface ProfileDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function ProfileHeader({ profileId }: { profileId: string }) {
  const profile = await getProfileById(profileId);
  if (!profile) notFound();

  return (
    <div className="space-y-1">
      <Link
        href="/profiles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profiles
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {profile.displayName ?? profile.id.slice(0, 12) + "…"}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{profile.id}</span>
            <span>
              Member since{" "}
              {profile.createdAt.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProfileActivity({
  profileId,
  range,
}: {
  profileId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const breakdown = await getProfileActivityBreakdown(profileId, timeRange);

  return <ProfileActivityChart data={breakdown} />;
}

async function ProfileTimeline({
  profileId,
  range,
}: {
  profileId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const volumeData = await getProfileEventVolume(profileId, timeRange);

  return <ProfileTimelineChart data={volumeData} />;
}

async function ProfileEvents({
  profileId,
  range,
}: {
  profileId: string;
  range: string;
}) {
  const timeRange = timeRangeFromParams({ range });
  const [events, devices] = await Promise.all([
    getProfileEvents(profileId, timeRange, PAGE_SIZE, 0),
    getDevices(),
  ]);

  return (
    <ProfileEventStream
      profileId={profileId}
      range={range}
      initialEvents={events}
      devices={devices}
    />
  );
}

export default async function ProfileDetailPage({
  params,
  searchParams,
}: ProfileDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const rangeRaw = sp.range;
  const range = (Array.isArray(rangeRaw) ? rangeRaw[0] : rangeRaw) ?? "24h";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Suspense
          fallback={
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          }
        >
          <ProfileHeader profileId={id} />
        </Suspense>
        <Suspense>
          <TimeRangeSelector />
        </Suspense>
      </div>

      <Suspense fallback={<ChartSkeleton />}>
        <ProfileActivity profileId={id} range={range} />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <ProfileTimeline profileId={id} range={range} />
      </Suspense>

      <Suspense fallback={<ProfilesTableSkeleton />}>
        <ProfileEvents profileId={id} range={range} />
      </Suspense>
    </div>
  );
}
