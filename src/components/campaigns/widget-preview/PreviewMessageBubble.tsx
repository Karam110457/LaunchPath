import { getContrastColor } from "./contrast";

interface PreviewMessageAttachment {
  name: string;
  type: string;
  url: string;
}

interface PreviewMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  attachment?: PreviewMessageAttachment;
}

interface PreviewMessageBubbleProps {
  message: PreviewMessage;
  primaryColor: string;
  isDark?: boolean;
}

function formatText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <a
          key={match.index}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {match[3]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function PreviewMessageBubble({
  message,
  primaryColor,
  isDark = false,
}: PreviewMessageBubbleProps) {
  const isUser = message.role === "user";
  const lines = message.content.split("\n");
  const contrastColor = getContrastColor(primaryColor);

  return (
    <div
      className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed break-words animate-in fade-in slide-in-from-bottom-1 duration-200 ${
        isUser
          ? "self-end rounded-2xl rounded-br-sm"
          : `self-start rounded-2xl rounded-bl-sm ${isDark ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"}`
      }`}
      style={isUser ? { backgroundColor: primaryColor, color: contrastColor } : undefined}
    >
      {message.attachment && (
        message.attachment.type.startsWith("image/") ? (
          <img
            src={message.attachment.url}
            alt={message.attachment.name}
            className="max-w-full rounded-lg mb-1.5"
            style={{ maxHeight: 160 }}
          />
        ) : (
          <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1.5 text-xs ${
            isUser
              ? "bg-white/15"
              : isDark ? "bg-gray-700" : "bg-gray-200"
          }`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate">{message.attachment.name}</span>
          </div>
        )
      )}
      {lines.map((line, i) => (
        <span key={i}>
          {formatText(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

export type { PreviewMessage, PreviewMessageAttachment };
