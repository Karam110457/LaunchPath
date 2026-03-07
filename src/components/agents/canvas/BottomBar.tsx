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
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/60 dark:border-zinc-700/40 shadow-sm rounded-xl p-1.5">
        <button
          onClick={() => fitView({ padding: 0.3, duration: 300 })}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
            "flex items-center justify-between px-5 py-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/60 dark:border-zinc-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full transition-all cursor-text hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
            testMode && "gradient-glow-ring border-transparent"
          )}
        >
          <span className="text-[13px] text-zinc-400 dark:text-zinc-500">
            {testMode ? "Chatting with Aira..." : "Describe your workflow to Aira"}
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <Maximize2 className="w-3.5 h-3.5 rotate-45" />
            </button>
            <button className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ml-1"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
