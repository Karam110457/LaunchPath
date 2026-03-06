"use client";

import { useState, useCallback } from "react";
import { PreviewLauncher } from "./PreviewLauncher";
import { PreviewChatPanel } from "./PreviewChatPanel";
import { GreetingBubble } from "./GreetingBubble";
import type { WidgetConfig } from "@/lib/channels/types";

/** Size presets: [launcherSize, panelWidth, panelHeight, fontSize] */
const SIZE_MAP = {
  compact: { launcher: 48, panelW: 340, panelH: 460, fontSize: 13 },
  default: { launcher: 56, panelW: 380, panelH: 520, fontSize: 14 },
  large: { launcher: 64, panelW: 420, panelH: 580, fontSize: 15 },
} as const;

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
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const position = config.position || "right";
  const primaryColor = config.primaryColor || "#6366f1";
  const canChat = Boolean(token && agentId);
  const size = SIZE_MAP[config.widgetSize || "default"];

  const hasGreeting = Boolean(config.greetingMessage?.trim());
  const showGreeting = hasGreeting && !isOpen && !greetingDismissed;

  const handleOpenChat = useCallback(() => {
    setIsOpen(true);
    setGreetingDismissed(true);
  }, []);

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
          panelWidth={size.panelW}
          panelHeight={size.panelH}
          fontSize={size.fontSize}
        />
      )}

      {showGreeting && (
        <GreetingBubble
          message={config.greetingMessage!}
          delay={config.greetingDelay ?? 3}
          position={position}
          isDark={config.theme === "dark"}
          isSharp={config.borderRadius === "sharp"}
          onDismiss={() => setGreetingDismissed(true)}
          onClick={handleOpenChat}
          bottomOffset={size.launcher + 32}
        />
      )}

      <PreviewLauncher
        isOpen={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpenChat())}
        primaryColor={primaryColor}
        position={position}
        launcherIcon={config.launcherIcon}
        size={size.launcher}
      />
    </>
  );
}
