"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading the dashboard."}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <Button onClick={reset} variant="outline" size="sm">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
