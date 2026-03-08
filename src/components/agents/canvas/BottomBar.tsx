"use client";

import { useReactFlow } from "@xyflow/react";
import { Maximize2, Mic, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomBarProps {
  testMode: boolean;
  onToggleTest: () => void;
}

export function BottomBar({ testMode, onToggleTest }: BottomBarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <>
      {/* Zoom controls (moved to absolute bottom left) */}
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1 bg-white/70 canvas-dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-sm rounded-xl p-1.5">
        <button
          onClick={() => fitView({ padding: 0.3, duration: 300 })}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors"
          title="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main chat input pill (centered) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[600px] max-w-[90vw]">
        <div
          onClick={onToggleTest}
          className={cn(
            "flex items-center justify-between px-5 py-3 bg-white/70 canvas-dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 canvas-dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full transition-all cursor-text hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
            testMode && "gradient-glow-ring border-transparent"
          )}
        >
          <span className="text-[13px] text-neutral-400 canvas-dark:text-neutral-500">
            {testMode ? "Chatting with Aira..." : "Describe your workflow to Aira"}
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors">
              <Maximize2 className="w-3.5 h-3.5 rotate-45" />
            </button>
            <button className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 hover:bg-black/5 canvas-dark:hover:bg-white/5 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-full bg-neutral-100 canvas-dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 canvas-dark:hover:bg-neutral-700 hover:text-neutral-800 canvas-dark:hover:text-neutral-200 transition-colors ml-1"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
