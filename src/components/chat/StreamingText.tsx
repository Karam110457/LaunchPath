"use client";

/**
 * StreamingText — renders text with a blinking cursor while streaming.
 * When streaming is done the cursor disappears.
 */

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {content}
      {isStreaming && (
        <span
          className="inline-block w-0.5 h-4 bg-current ml-0.5 -mb-0.5 animate-pulse"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
