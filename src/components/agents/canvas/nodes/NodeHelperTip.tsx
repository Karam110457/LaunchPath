"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "launchpath_canvas_helpers_dismissed";

/** Read dismissed set from localStorage. */
function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

/** Persist dismissed set to localStorage. */
function saveDismissed(dismissed: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch {
    // ignore
  }
}

interface NodeHelperTipProps {
  tipId: string;
  icon: React.ReactNode;
  text: string;
  /** Tailwind classes to position the tip relative to the node. */
  position?: string;
}

export function NodeHelperTip({ tipId, icon, text, position = "left-1/2 -translate-x-1/2 top-full mt-3" }: NodeHelperTipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = getDismissed();
    if (!dismissed.has(tipId)) setVisible(true);
  }, [tipId]);

  if (!visible) return null;

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setVisible(false);
    const dismissed = getDismissed();
    dismissed.add(tipId);
    saveDismissed(dismissed);
  };

  return (
    <div
      className={`absolute ${position} z-30 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-500`}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 px-3 py-2 bg-zinc-900/95 canvas-dark:bg-zinc-800/95 backdrop-blur-sm border border-zinc-700/80 rounded-xl shadow-lg min-w-[200px] max-w-[280px] whitespace-normal">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <p className="text-[11px] text-white leading-relaxed flex-1">
          {text}
        </p>
        <button
          onClick={dismiss}
          className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 -mt-0.5 -mr-1"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
