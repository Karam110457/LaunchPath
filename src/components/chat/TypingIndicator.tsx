"use client";

/**
 * TypingIndicator — three bouncing dots shown while waiting for the first
 * token from the agent (between send and first text-delta).
 */

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 w-fit">
      <span className="sr-only">Agent is thinking…</span>
      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.32s]" />
      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.16s]" />
      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" />
    </div>
  );
}
