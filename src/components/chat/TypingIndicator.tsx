"use client";

/**
 * TypingIndicator — shown between message send and first token arrival.
 * Three dots with a smooth wave animation in primary/accent color.
 */

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2" aria-label="Agent is thinking…">
      <span className="sr-only">Agent is thinking…</span>
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="block w-2 h-2 rounded-full bg-primary/60"
          style={{
            animation: "dot-wave 1.3s ease-in-out infinite",
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
