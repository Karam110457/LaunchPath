"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { PANEL_SLIDE, FADE } from "../animation-constants";

interface NodeModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function NodeModal({
  onClose,
  title,
  children,
}: NodeModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop with fade */}
      <motion.div
        className="fixed inset-0 z-[40] bg-black/5"
        onClick={onClose}
        initial={FADE.initial}
        animate={FADE.animate}
        exit={FADE.exit}
        transition={FADE.transition}
      />

      {/* Floating Right Panel */}
      <motion.div
        className="absolute top-6 bottom-6 right-6 w-[360px] max-w-[calc(100vw-3rem)] z-50 flex flex-col bg-white/70 canvas-dark:bg-neutral-900/70 text-neutral-900 canvas-dark:text-neutral-100 backdrop-blur-2xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden"
        initial={PANEL_SLIDE.initial}
        animate={PANEL_SLIDE.animate}
        exit={PANEL_SLIDE.exit}
        transition={PANEL_SLIDE.transition}
      >
        {/* Header */}
        <div className="flex flex-col px-6 pt-6 pb-4 border-b border-neutral-200/50 canvas-dark:border-neutral-700/50 flex-shrink-0 bg-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-neutral-900 canvas-dark:text-neutral-100 tracking-tight">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
    </>
  );
}
