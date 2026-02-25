"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Check,
  Eye,
  MessageSquare,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DemoConfig } from "@/lib/ai/schemas";
import { configToCode } from "@/lib/builder/config-to-code";
import { useBuilderStream } from "@/hooks/useBuilderStream";
import { BuilderChat } from "./BuilderChat";
import { BuilderPreview } from "./BuilderPreview";

interface BuilderPageProps {
  systemId: string;
  initialConfig: DemoConfig;
  initialPageCode?: string | null;
  segment: string;
  transformationFrom?: string;
  transformationTo?: string;
  businessName: string;
  solution: string;
}

export function BuilderPage({
  systemId,
  initialConfig,
  initialPageCode,
  segment,
  transformationFrom,
  transformationTo,
}: BuilderPageProps) {
  // DemoConfig is read-only — drives InteractiveDemo scope (form fields, scoring)
  const demoConfig = initialConfig;

  // Code state — initialized from saved page_code or generated from config
  const [draftCode, setDraftCode] = useState<string>(() => {
    if (initialPageCode) return initialPageCode;
    return configToCode(initialConfig, {
      segment,
      transformationFrom,
      transformationTo,
    });
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  // Ref so the stream hook always has the latest code
  const codeRef = useRef<string>(draftCode);
  useEffect(() => {
    codeRef.current = draftCode;
  }, [draftCode]);

  const handleCodeUpdate = useCallback((code: string) => {
    setDraftCode(code);
    setIsDirty(true);
    setPublishSuccess(false);
  }, []);

  const { messages, isStreaming, sendMessage } = useBuilderStream(
    systemId,
    codeRef as React.RefObject<string | null>,
    handleCodeUpdate
  );

  async function handlePublish() {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/builder/${systemId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: draftCode }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to publish");
      }

      setIsDirty(false);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (err) {
      console.error("Publish failed:", err);
    } finally {
      setIsPublishing(false);
    }
  }

  const previewProps = useMemo(
    () => ({
      systemId,
      demoConfig,
      code: draftCode,
    }),
    [systemId, demoConfig, draftCode]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header bar */}
      <header className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-foreground tracking-tight font-serif italic">
            Page Builder
          </h1>
          {isDirty && (
            <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
          {publishSuccess && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Check className="size-3" />
              Published
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/demo/${systemId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ExternalLink className="size-3" />
            View live
          </a>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!isDirty || isPublishing}
            className="h-8 px-4 text-xs font-semibold"
          >
            {isPublishing ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1.5" />
                Publishing...
              </>
            ) : (
              "Publish"
            )}
          </Button>
        </div>
      </header>

      {/* Mobile tab switcher */}
      <div className="flex md:hidden border-b border-border shrink-0" role="tablist" aria-label="Builder panels">
        <button
          role="tab"
          aria-selected={mobileTab === "chat"}
          aria-controls="builder-chat-panel"
          onClick={() => setMobileTab("chat")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-12 text-sm font-medium transition-colors",
            mobileTab === "chat"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          <MessageSquare className="size-4" />
          Chat
        </button>
        <button
          role="tab"
          aria-selected={mobileTab === "preview"}
          aria-controls="builder-preview-panel"
          onClick={() => setMobileTab("preview")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 h-12 text-sm font-medium transition-colors",
            mobileTab === "preview"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          )}
        >
          <Eye className="size-4" />
          Preview
        </button>
      </div>

      {/* Split panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel — 40% on desktop, full on mobile when active */}
        <div
          id="builder-chat-panel"
          role="tabpanel"
          aria-label="Chat panel"
          className={cn(
            "flex flex-col border-r border-border",
            "md:w-[40%] md:block",
            mobileTab === "chat" ? "w-full" : "hidden"
          )}
        >
          <BuilderChat
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={sendMessage}
          />
        </div>

        {/* Preview panel — 60% on desktop, full on mobile when active */}
        <div
          id="builder-preview-panel"
          role="tabpanel"
          aria-label="Preview panel"
          className={cn(
            "flex flex-col flex-1",
            "md:block",
            mobileTab === "preview" ? "w-full" : "hidden"
          )}
        >
          <BuilderPreview {...previewProps} />
        </div>
      </div>
    </div>
  );
}
