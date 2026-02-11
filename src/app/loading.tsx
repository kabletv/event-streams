import { KPISkeleton, ChartSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      </div>
      <KPISkeleton />
      <ChartSkeleton />
      <ChartSkeleton height={400} />
    </div>
  );
}
