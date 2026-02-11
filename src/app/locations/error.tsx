"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LocationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Locations error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">
            Failed to load locations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "Could not fetch location data."}
          </p>
          <Button onClick={reset} variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
