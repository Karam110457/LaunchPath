"use client";

/**
 * TypingIndicator — shown between message send and first token arrival.
 *
 * Rotates through a shuffled list of quirky in-progress phrases. Each word
 * fades in with a short enter animation then breathes with an infinite pulse.
 * On word change, the current word fades out, the index updates, the span
 * remounts (key={index}) which resets both CSS animations cleanly.
 */

import { useState, useEffect } from "react";

const PHRASES = [
  "Thinking...",
  "Cooking...",
  "Sussing...",
  "Scheming...",
  "Mapping...",
  "Brewing...",
  "Plotting...",
  "Crunching...",
  "On it...",
  "Mulling...",
  "Digging in...",
  "Connecting dots...",
  "Figuring...",
  "Strategising...",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle once per session so the order feels fresh each time
const SHUFFLED = shuffle(PHRASES);

// Animation applied to each word span:
// 1. word-materialise (300ms, one-shot): resolves from blur+scale into sharp focus
// 2. word-breathe (2.2s, 300ms delay, infinite): gentle opacity pulse 1 → 0.55 → 1
// The delay on word-breathe means it doesn't touch opacity during word-materialise's run.
const WORD_ANIMATION =
  "word-materialise 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both, word-breathe 2.2s 300ms ease-in-out infinite";

export function TypingIndicator() {
  const [index, setIndex] = useState(0);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

    const interval = setInterval(() => {
      // Fade out current word
      setHiding(true);
      // After fade-out completes, swap word and fade in
      pendingTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % SHUFFLED.length);
        setHiding(false);
      }, 210);
    }, 2400);

    return () => {
      clearInterval(interval);
      if (pendingTimeout) clearTimeout(pendingTimeout);
    };
  }, []);

  return (
    <div className="py-1" aria-label="Agent is thinking…">
      <span className="sr-only">Agent is thinking…</span>
      <span
        key={index}
        className="text-sm font-medium text-primary/90"
        style={
          hiding
            ? { opacity: 0, filter: "blur(3px)", transform: "scale(0.96)", transition: "opacity 200ms ease, filter 200ms ease, transform 200ms ease", animation: "none" }
            : { animation: WORD_ANIMATION }
        }
      >
        {SHUFFLED[index]}
      </span>
    </div>
  );
}
