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
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1 bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm rounded-xl p-1.5 liquid-glass">
        <button
          onClick={() => fitView({ padding: 0.3, duration: 300 })}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-black/5 transition-colors"
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
            "flex items-center justify-between px-5 py-3 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-full transition-all cursor-text hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] liquid-glass",
            testMode && "ring-2 ring-primary/20 border-primary/30"
          )}
        >
          <span className="text-[13px] text-zinc-400">
            {testMode ? "Chatting with Aira..." : "Describe your workflow to Aira"}
          </span>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-black/5 transition-colors">
              <Maximize2 className="w-3.5 h-3.5 rotate-45" />
            </button>
            <button className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-black/5 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors ml-1"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
