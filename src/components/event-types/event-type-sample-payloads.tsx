"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadMoreSamplePayloads } from "@/lib/actions/event-types";
import type { EventRow } from "@/lib/queries/types";

interface EventTypeSamplePayloadsProps {
  eventType: string;
  range: string;
  initialPayloads: EventRow[];
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function PayloadRow({ event }: { event: EventRow }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground w-16 shrink-0">
          {formatRelativeTime(event.createdAt)}
        </span>
        <span className="text-xs font-mono text-foreground/80 truncate">
          {JSON.stringify(event.payload).slice(0, 120)}
          {JSON.stringify(event.payload).length > 120 ? "…" : ""}
        </span>
      </button>
      {expanded && (
        <div className="bg-muted/30 border-t border-border px-6 py-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
            <span>ID: <span className="font-mono">{event.id}</span></span>
            <span>Time: {event.createdAt.toISOString()}</span>
            {event.deviceId && (
              <span>Device: <span className="font-mono">{event.deviceId}</span></span>
            )}
            {event.locationId && (
              <span>Location: <span className="font-mono">{event.locationId}</span></span>
            )}
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Full Payload
          </p>
          <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all max-h-80 overflow-y-auto rounded-md bg-background p-3 border border-border">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function EventTypeSamplePayloads({
  eventType,
  range,
  initialPayloads,
}: EventTypeSamplePayloadsProps) {
  const [payloads, setPayloads] = useState<EventRow[]>(initialPayloads);
  const [hasMore, setHasMore] = useState(initialPayloads.length >= 10);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    startTransition(async () => {
      const more = await loadMoreSamplePayloads(eventType, range, payloads.length, 10);
      // Dates come back as strings from server actions — rehydrate
      const rehydrated = more.map((e) => ({
        ...e,
        createdAt: new Date(e.createdAt),
      }));
      setPayloads((prev) => [...prev, ...rehydrated]);
      if (rehydrated.length < 10) setHasMore(false);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Payloads</CardTitle>
        <CardDescription>
          Recent events with full payload data
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {payloads.length === 0 ? (
          <div className="flex items-center justify-center py-8 px-4">
            <p className="text-muted-foreground">
              No sample payloads found for this time range.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md">
              {payloads.map((event) => (
                <PayloadRow key={event.id} event={event} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center py-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
