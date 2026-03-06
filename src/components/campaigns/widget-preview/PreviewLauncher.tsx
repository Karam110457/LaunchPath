interface PreviewLauncherProps {
  isOpen: boolean;
  onClick: () => void;
  primaryColor: string;
  position: "right" | "left";
  launcherIcon?: string;
}

export function PreviewLauncher({
  isOpen,
  onClick,
  primaryColor,
  position,
  launcherIcon,
}: PreviewLauncherProps) {
  const isIconUrl = launcherIcon?.startsWith("http");
  const isEmoji = launcherIcon && !isIconUrl && launcherIcon.length <= 4;

  return (
    <button
      onClick={onClick}
      className={`absolute bottom-5 w-14 h-14 rounded-full border-none cursor-pointer flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 animate-in zoom-in-50 duration-500 overflow-hidden ${
        position === "right" ? "right-5" : "left-5"
      }`}
      style={{ backgroundColor: primaryColor }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {isOpen ? (
        <svg
          width="20"
          height="20"
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
          className="w-7 h-7 object-contain"
        />
      ) : isEmoji ? (
        <span className="text-2xl leading-none">{launcherIcon}</span>
      ) : (
        <svg
          width="24"
          height="24"
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
