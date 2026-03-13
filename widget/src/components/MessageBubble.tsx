import { h } from "preact";
import type { Message } from "../types";
import { getContrastColor } from "../contrast";

interface MessageBubbleProps {
  message: Message;
  primaryColor: string;
}

/** Basic formatting: newlines, **bold**, and clickable URLs */
function formatText(text: string): (string | h.JSX.Element)[] {
  const parts: (string | h.JSX.Element)[] = [];
  const regex = /(\*\*(.+?)\*\*)|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(<strong>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(
        <a href={match[3]} target="_blank" rel="noopener noreferrer">
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

function renderContent(text: string): h.JSX.Element[] {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {formatText(line)}
      {i < lines.length - 1 && <br />}
    </span>
  ));
}

function AttachmentPreview({ attachment, isUser }: {
  attachment: Message["attachment"];
  isUser: boolean;
}) {
  if (!attachment) return null;
  const isImage = attachment.fileType.startsWith("image/");
  const sizeKB = Math.round(attachment.fileSize / 1024);

  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View image: ${attachment.fileName}`}
        style={{ display: "block", marginBottom: "6px", borderRadius: "8px", overflow: "hidden" }}
      >
        <img
          src={attachment.url}
          alt={attachment.fileName}
          style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", display: "block" }}
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Download ${attachment.fileName}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "8px",
        background: isUser ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
        textDecoration: "none",
        color: "inherit",
        marginBottom: "6px",
        fontSize: "12px",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.fileName}</span>
      <span style={{ opacity: 0.6, flexShrink: 0 }}>{sizeKB}KB</span>
    </a>
  );
}

export function MessageBubble({ message, primaryColor }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const contrastColor = getContrastColor(primaryColor);

  return (
    <div
      class={`lp-msg ${isUser ? "lp-msg-user" : "lp-msg-assistant"}`}
      style={isUser ? { backgroundColor: primaryColor, color: contrastColor } : undefined}
      role="article"
      aria-label={`${isUser ? "You" : "Assistant"}: ${message.content || "attachment"}`}
    >
      {message.attachment && (
        <AttachmentPreview attachment={message.attachment} isUser={isUser} />
      )}
      {message.content && renderContent(message.content)}
    </div>
  );
}
