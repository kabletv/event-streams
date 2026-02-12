interface JsonPayloadViewerProps {
  payload: Record<string, unknown>;
}

export function JsonPayloadViewer({ payload }: JsonPayloadViewerProps) {
  const formatted = JSON.stringify(payload, null, 2);

  return (
    <div className="bg-muted/30 border-t border-border px-6 py-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Full Payload
      </p>
      <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all max-h-80 overflow-y-auto rounded-md bg-background p-3 border border-border">
        {formatted}
      </pre>
    </div>
  );
}
