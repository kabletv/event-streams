"use client";

import { useState } from "react";

interface JsonViewerProps {
  data: Record<string, unknown>;
  maxPreviewLength?: number;
}

export function JsonViewer({
  data,
  maxPreviewLength = 120,
}: JsonViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const preview = JSON.stringify(data);
  const truncated =
    preview.length > maxPreviewLength
      ? preview.slice(0, maxPreviewLength) + "…"
      : preview;

  if (expanded) {
    return (
      <div className="relative">
        <button
          onClick={() => setExpanded(false)}
          className="absolute right-2 top-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Collapse
        </button>
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-all">
          {json}
        </pre>
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="text-left text-xs font-mono text-muted-foreground hover:text-foreground transition-colors truncate block max-w-full"
    >
      {truncated}
    </button>
  );
}
