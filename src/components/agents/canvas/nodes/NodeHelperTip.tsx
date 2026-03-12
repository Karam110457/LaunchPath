"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { HELPER_TIP } from "../animation-constants";
import { useTips } from "../tips-context";

export const TIPS_STORAGE_KEY = "launchpath_canvas_helpers_dismissed";

/** Read dismissed set from localStorage. */
export function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(TIPS_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

/** Persist dismissed set to localStorage. */
export function saveDismissed(dismissed: Set<string>) {
  try {
    localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify([...dismissed]));
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
  const { showTips } = useTips();
  const [dismissed, setDismissedState] = useState(false);

  useEffect(() => {
    const d = getDismissed();
    if (d.has(tipId)) setDismissedState(true);
  }, [tipId]);

  // Re-check dismissed state when showTips toggles on (in case resetDismissed was called)
  useEffect(() => {
    if (showTips) {
      const d = getDismissed();
      if (!d.has(tipId)) setDismissedState(false);
    }
  }, [showTips, tipId]);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDismissedState(true);
    const d = getDismissed();
    d.add(tipId);
    saveDismissed(d);
  };

  const visible = showTips && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`absolute ${position} z-30 pointer-events-auto`}
          initial={HELPER_TIP.initial}
          animate={HELPER_TIP.animate}
          exit={HELPER_TIP.exit}
          transition={HELPER_TIP.transition}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2 px-3 py-2 bg-neutral-900/95 canvas-dark:bg-neutral-800/95 backdrop-blur-sm border border-neutral-700/80 rounded-xl shadow-lg min-w-[200px] max-w-[280px] whitespace-normal">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <p className="text-[11px] text-white leading-relaxed flex-1">
              {text}
            </p>
            <button
              onClick={dismiss}
              className="p-0.5 rounded text-neutral-500 hover:text-neutral-300 transition-colors shrink-0 -mt-0.5 -mr-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
