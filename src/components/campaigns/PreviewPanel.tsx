"use client";

import { useState, useEffect, useRef } from "react";
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
  const [iframeStatus, setIframeStatus] = useState<
    "idle" | "loading" | "loaded" | "blocked"
  >("idle");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const apiOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const hasWebsite = clientWebsite.trim().length > 0;

  // Reset iframe status when URL changes
  useEffect(() => {
    if (hasWebsite) {
      setIframeStatus("loading");
    } else {
      setIframeStatus("idle");
    }
  }, [clientWebsite, hasWebsite]);

  // Detect blocked iframes — onError doesn't fire for X-Frame-Options,
  // so we check if we can access the iframe's contentWindow after load.
  function handleIframeLoad() {
    try {
      // If we can access contentDocument, iframe loaded something
      const doc = iframeRef.current?.contentDocument;
      // If doc is null or has no body content, likely blocked
      if (!doc || !doc.body || doc.body.innerHTML === "") {
        setIframeStatus("blocked");
      } else {
        setIframeStatus("loaded");
      }
    } catch {
      // Cross-origin — this is actually a good sign, means the site loaded
      setIframeStatus("loaded");
    }
  }

  return (
    <div className="flex-1 relative overflow-hidden rounded-lg m-2">
      {/* Background layer — always present */}
      {hasWebsite && iframeStatus !== "blocked" ? (
        <iframe
          ref={iframeRef}
          key={clientWebsite}
          src={clientWebsite}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0 absolute inset-0"
          title="Client website preview"
          onLoad={handleIframeLoad}
          onError={() => setIframeStatus("blocked")}
        />
      ) : null}

      {/* Placeholder — shown when no URL, loading, or blocked */}
      {(!hasWebsite || iframeStatus === "blocked") && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-white/60 dark:bg-white/10 mb-3 shadow-sm">
            <Globe className="size-7 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground/40">
            {iframeStatus === "blocked"
              ? "This site blocks previewing"
              : "Website Preview"}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1 max-w-xs text-center">
            {iframeStatus === "blocked"
              ? "Most sites block iframe embedding. Your widget will still work when deployed."
              : "Enter a client website URL in the settings panel."}
          </p>
        </div>
      )}

      {/* Widget overlay — always visible for visual preview */}
      <WidgetPreview
        config={config}
        token={token}
        agentId={agentId}
        apiOrigin={apiOrigin}
      />
    </div>
  );
}
