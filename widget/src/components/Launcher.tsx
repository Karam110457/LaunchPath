import { h } from "preact";
import type { WidgetConfig } from "../types";
import { getContrastColor } from "../contrast";

interface LauncherProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClick: () => void;
}

export function Launcher({ config, isOpen, onClick }: LauncherProps) {
  const color = config.primaryColor || "#6366f1";
  const contrast = getContrastColor(color);
  const icon = config.launcherIcon;
  const isIconUrl = icon?.startsWith("http");
  const isEmoji = icon && !isIconUrl && icon.length <= 4;

  return (
    <button
      class="lp-launcher"
      onClick={onClick}
      style={{ backgroundColor: color, color: contrast }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {isOpen ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : isIconUrl ? (
        <img src={icon} alt="Chat" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
      ) : isEmoji ? (
        <span style={{ fontSize: "24px", lineHeight: 1 }}>{icon}</span>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}
