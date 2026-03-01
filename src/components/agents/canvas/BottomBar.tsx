"use client";

import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomBarProps {
  testMode: boolean;
  onToggleTest: () => void;
}

export function BottomBar({ testMode, onToggleTest }: BottomBarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-1">
        <button
          onClick={() => zoomOut()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomIn()}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => fitView({ padding: 0.3, duration: 300 })}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Test mode toggle */}
      <Button
        variant={testMode ? "default" : "outline"}
        size="sm"
        onClick={onToggleTest}
        className="gap-1.5"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {testMode ? "Close Test" : "Test Agent"}
      </Button>
    </div>
  );
}
