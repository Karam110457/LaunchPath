"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function NodeModal({
  open,
  onClose,
  title,
  children,
}: NodeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop (invisible but captures clicks to close) */}
      <div
        className="fixed inset-0 z-[40]"
        onClick={onClose}
      />

      {/* Floating Right Panel */}
      <div className="absolute top-6 bottom-6 right-6 w-[360px] max-w-[calc(100vw-3rem)] z-50 flex flex-col bg-white/70 dark:bg-zinc-900/70 text-zinc-900 dark:text-zinc-100 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[2rem] overflow-hidden animate-in slide-in-from-right-8 fade-in duration-200">

        {/* Header */}
        <div className="flex flex-col px-6 pt-6 pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex-shrink-0 bg-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            <button className="text-zinc-900 dark:text-zinc-100 pb-0.5" style={{ borderBottom: "2px solid transparent", borderImage: "linear-gradient(135deg, #FF8C00, #9D50BB) 1" }}>Configure</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-1">
          {children}
        </div>
      </div>
    </>
  );
}
