"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TIME_RANGES } from "@/lib/constants";

export function TimeRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("range") || "24h";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1">
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          variant={currentRange === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleChange(range.value)}
          className="text-xs"
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
