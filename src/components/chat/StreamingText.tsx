"use client";

/**
 * StreamingText — renders markdown text with a blinking cursor while streaming.
 * When streaming is done the cursor disappears.
 */

import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingText({ content, isStreaming }: StreamingTextProps) {
  return (
    <div className="prose-chat break-words">
      <ReactMarkdown
        components={{
          // Keep paragraphs tight (no extra margin in chat)
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          // Inline styles
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {children}
            </a>
          ),
          // Code
          code: ({ children }) => (
            <code className="bg-muted px-1 py-0.5 rounded text-sm">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span
          className="inline-block w-0.5 h-[1em] bg-primary/80 ml-0.5 -mb-[0.1em] rounded-[1px]"
          style={{ animation: "cursor-blink 1.06s step-end infinite" }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
