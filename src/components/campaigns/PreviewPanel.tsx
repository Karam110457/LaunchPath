"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { WidgetPreview } from "./widget-preview/WidgetPreview";
import type { WidgetConfig } from "@/lib/channels/types";

interface PreviewPanelProps {
  config: WidgetConfig;
  token: string;
  agentId: string;
  clientWebsite: string;
}

export function PreviewPanel({
  config,
  token,
  agentId,
  clientWebsite,
}: PreviewPanelProps) {
  const [iframeError, setIframeError] = useState(false);
  const apiOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const hasWebsite = clientWebsite.trim().length > 0;
  const showIframe = hasWebsite && !iframeError;

  return (
    <div className="flex-1 relative overflow-hidden bg-muted/30 rounded-lg m-2">
      {/* Website iframe or placeholder */}
      {showIframe ? (
        <iframe
          key={clientWebsite}
          src={clientWebsite}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          title="Client website preview"
          onError={() => setIframeError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50 mb-3">
            <Globe className="size-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground/50">
            {iframeError
              ? "This website can't be previewed"
              : "Website Preview"}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs text-center">
            {iframeError
              ? "The site blocks embedding. Your widget will still work when deployed."
              : "Enter a client website URL to see how the widget looks."}
          </p>
        </div>
      )}

      {/* Widget overlay */}
      {token && agentId && (
        <WidgetPreview
          config={config}
          token={token}
          agentId={agentId}
          apiOrigin={apiOrigin}
        />
      )}
    </div>
  );
}
