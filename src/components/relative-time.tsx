"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RelativeTime({ date }: { date: string }) {
  const d = new Date(date);
  const relative = formatDistanceToNow(d, { addSuffix: true });
  const full = d.toLocaleString();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default text-muted-foreground">{relative}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{full}</p>
      </TooltipContent>
    </Tooltip>
  );
}
