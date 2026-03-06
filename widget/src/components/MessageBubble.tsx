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

export function MessageBubble({ message, primaryColor }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const contrastColor = getContrastColor(primaryColor);

  return (
    <div
      class={`lp-msg ${isUser ? "lp-msg-user" : "lp-msg-assistant"}`}
      style={isUser ? { backgroundColor: primaryColor, color: contrastColor } : undefined}
    >
      {renderContent(message.content)}
    </div>
  );
}
