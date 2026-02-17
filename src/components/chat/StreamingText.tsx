"use client";

/**
 * StreamingText — renders markdown with rich visual hierarchy.
 * Handles headings, bold, lists, blockquotes, code, links.
 */

import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingText({ content, isStreaming: _isStreaming }: StreamingTextProps) {
  return (
    <div className="break-words space-y-0.5">
      <ReactMarkdown
        components={{
          // ── Headings ──────────────────────────────────────────────────────
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-foreground mt-5 mb-2 first:mt-0 pb-1.5 border-b border-border/40">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-foreground mt-4 mb-1.5 first:mt-0 pb-1 border-b border-border/30">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-foreground/90 mt-3 mb-1 first:mt-0">
              {children}
            </h3>
          ),

          // ── Paragraphs ────────────────────────────────────────────────────
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
          ),

          // ── Inline ────────────────────────────────────────────────────────
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),

          // ── Lists ─────────────────────────────────────────────────────────
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2.5 mt-1 space-y-1.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2.5 mt-1 space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">{children}</li>
          ),

          // ── Blockquote ───────────────────────────────────────────────────
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
              {children}
            </blockquote>
          ),

          // ── HR ───────────────────────────────────────────────────────────
          hr: () => <hr className="border-border/40 my-3" />,

          // ── Links ────────────────────────────────────────────────────────
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),

          // ── Code ─────────────────────────────────────────────────────────
          code: ({ children }) => (
            <code className="bg-muted/80 border border-border/40 px-1.5 py-0.5 rounded text-[0.8em] font-mono text-foreground/90">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted/60 border border-border/40 rounded-lg px-3 py-2.5 my-2 overflow-x-auto text-[0.8em] font-mono">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
