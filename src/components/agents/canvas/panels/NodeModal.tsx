"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { FADE } from "../animation-constants";

interface NodeModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Spring config shared by both panel and fullscreen transitions
const SPRING = { type: "spring" as const, stiffness: 300, damping: 28 };

// Panel mode: slide in from right
const panelVariants = {
  initial: { x: 24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 24, opacity: 0 },
};

// Fullscreen mode: scale up from center
const fullscreenVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

export function NodeModal({
  onClose,
  title,
  children,
}: NodeModalProps) {
  const [expanded, setExpanded] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expanded) {
          setExpanded(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, expanded]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[40]"
        onClick={() => expanded ? setExpanded(false) : onClose()}
        initial={FADE.initial}
        animate={{
          opacity: 1,
          backgroundColor: expanded
            ? "rgba(0, 0, 0, 0.4)"
            : "rgba(0, 0, 0, 0.05)",
        }}
        exit={FADE.exit}
        transition={{ duration: 0.25 }}
      />

      <AnimatePresence mode="wait">
        {expanded ? (
          /* ── Fullscreen mode ──────────────────────────────────── */
          <motion.div
            key="fullscreen"
            className="fixed inset-4 sm:inset-8 z-50 flex flex-col bg-white/90 canvas-dark:bg-neutral-900/90 text-neutral-900 canvas-dark:text-neutral-100 backdrop-blur-2xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_24px_80px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden"
            variants={fullscreenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={SPRING}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 canvas-dark:border-neutral-700/50 flex-shrink-0">
              <h2 className="text-base font-semibold text-neutral-900 canvas-dark:text-neutral-100 tracking-tight">
                {title}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
                  title="Collapse to panel"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content — wider in fullscreen */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-1">
                {children}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Panel mode (default) ─────────────────────────────── */
          <motion.div
            key="panel"
            className="absolute top-6 bottom-6 right-6 w-[360px] max-w-[calc(100vw-3rem)] z-50 flex flex-col bg-white/70 canvas-dark:bg-neutral-900/70 text-neutral-900 canvas-dark:text-neutral-100 backdrop-blur-xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={SPRING}
          >
            {/* Header */}
            <div className="flex flex-col px-6 pt-6 pb-4 border-b border-neutral-200/50 canvas-dark:border-neutral-700/50 flex-shrink-0 bg-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-neutral-900 canvas-dark:text-neutral-100 tracking-tight">
                    {title}
                  </h2>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setExpanded(true)}
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
                    title="Expand to fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400">
                <button className="text-neutral-900 canvas-dark:text-neutral-100 pb-0.5" style={{ borderBottom: "2px solid transparent", borderImage: "linear-gradient(135deg, #FF8C00, #9D50BB) 1" }}>Configure</button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
