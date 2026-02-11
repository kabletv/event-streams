"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StreamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-destructive">
          Stream Error
        </h2>
        <p className="text-muted-foreground max-w-md">
          Failed to load the event stream. This could be a database connectivity
          issue. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={() => reset()} variant="outline">
        Retry
      </Button>
    </div>
  );
}
