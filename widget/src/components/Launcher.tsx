import { h } from "preact";
import type { WidgetConfig } from "../types";
import { getContrastColor } from "../contrast";

interface LauncherProps {
  config: WidgetConfig;
  isOpen: boolean;
  onClick: () => void;
  size?: number;
}

export function Launcher({ config, isOpen, onClick, size = 56 }: LauncherProps) {
  const color = config.primaryColor || "#6366f1";
  const contrast = getContrastColor(color);
  const icon = config.launcherIcon;
  const isIconUrl = icon?.startsWith("http");
  const isEmoji = icon && !isIconUrl && icon.length <= 4;

  const scale = size / 56;
  const iconSize = Math.round(24 * scale);
  const closeSize = Math.round(20 * scale);
  const imgSize = Math.round(28 * scale);

  return (
    <button
      class="lp-launcher"
      onClick={onClick}
      style={{ backgroundColor: color, color: contrast, width: `${size}px`, height: `${size}px` }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {isOpen ? (
        <svg width={closeSize} height={closeSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : isIconUrl ? (
        <img src={icon} alt="Chat" style={{ width: `${imgSize}px`, height: `${imgSize}px`, objectFit: "contain" }} />
      ) : isEmoji ? (
        <span style={{ fontSize: `${Math.round(24 * scale)}px`, lineHeight: 1 }}>{icon}</span>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}
