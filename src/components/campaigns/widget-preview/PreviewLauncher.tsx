import { getContrastColor } from "./contrast";

interface PreviewLauncherProps {
  isOpen: boolean;
  onClick: () => void;
  primaryColor: string;
  position: "right" | "left";
  launcherIcon?: string;
  size?: number;
}

export function PreviewLauncher({
  isOpen,
  onClick,
  primaryColor,
  position,
  launcherIcon,
  size = 56,
}: PreviewLauncherProps) {
  const isIconUrl = launcherIcon?.startsWith("http");
  const isEmoji = launcherIcon && !isIconUrl && launcherIcon.length <= 4;
  const contrastColor = getContrastColor(primaryColor);

  const iconScale = size / 56; // scale relative to default
  const iconSize = Math.round(24 * iconScale);
  const closeIconSize = Math.round(20 * iconScale);
  const imgSize = Math.round(28 * iconScale);

  return (
    <button
      onClick={onClick}
      className={`absolute bottom-5 rounded-full border-none cursor-pointer flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 animate-in zoom-in-50 duration-500 overflow-hidden ${
        position === "right" ? "right-5" : "left-5"
      }`}
      style={{
        backgroundColor: primaryColor,
        color: contrastColor,
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {isOpen ? (
        <svg
          width={closeIconSize}
          height={closeIconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : isIconUrl ? (
        <img
          src={launcherIcon}
          alt="Chat"
          style={{ width: `${imgSize}px`, height: `${imgSize}px`, objectFit: "contain" }}
        />
      ) : isEmoji ? (
        <span style={{ fontSize: `${Math.round(24 * iconScale)}px`, lineHeight: 1 }}>{launcherIcon}</span>
      ) : (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
}
