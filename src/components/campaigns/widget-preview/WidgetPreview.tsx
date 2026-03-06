"use client";

import { useState } from "react";
import { PreviewLauncher } from "./PreviewLauncher";
import { PreviewChatPanel } from "./PreviewChatPanel";
import type { WidgetConfig } from "@/lib/channels/types";

interface WidgetPreviewProps {
  config: WidgetConfig;
  token: string;
  agentId: string;
  apiOrigin: string;
}

export function WidgetPreview({
  config,
  token,
  agentId,
  apiOrigin,
}: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const position = config.position || "right";
  const primaryColor = config.primaryColor || "#6366f1";
  const canChat = Boolean(token && agentId);

  return (
    <>
      {isOpen && (
        <PreviewChatPanel
          config={config}
          token={token}
          agentId={agentId}
          apiOrigin={apiOrigin}
          position={position}
          onClose={() => setIsOpen(false)}
          canChat={canChat}
        />
      )}
      <PreviewLauncher
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        primaryColor={primaryColor}
        position={position}
      />
    </>
  );
}
