"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RANGE_OPTIONS } from "@/lib/time-range";

const DEFAULT_RANGE = "24h";

export function TimeRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? DEFAULT_RANGE;

  const handleSelect = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={current === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => handleSelect(option.value)}
          className="text-xs"
        >
          {option.value}
        </Button>
      ))}
    </div>
  );
}
