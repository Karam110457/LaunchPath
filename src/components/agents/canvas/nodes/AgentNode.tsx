"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { AgentNodeData } from "../canvas-types";

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  const modelShort = d.model
    .replace("claude-", "")
    .replace(/-\d{8}$/, "");

  return (
    <div className="group relative">
      {/* Ambient glow on hover */}
      <div className="absolute -inset-3 rounded-3xl bg-primary/15 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-400 pointer-events-none" />

      <div className="relative w-[210px] bg-card border border-border/60 rounded-2xl shadow-xl cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden">
        {/* Active status pulse */}
        {d.status === "active" && (
          <div className="absolute top-3.5 right-3.5 z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        )}

        {/* Avatar + identity */}
        <div className="flex flex-col items-center px-5 pt-6 pb-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-3.5 shadow-inner">
            <span className="text-3xl select-none">{d.avatarEmoji}</span>
          </div>

          <h3 className="text-[13px] font-semibold text-foreground text-center w-full truncate leading-tight mb-1.5">
            {d.name}
          </h3>

          <div className="inline-flex items-center bg-muted/50 border border-border/40 rounded-full px-2.5 py-0.5">
            <span className="text-[10px] font-mono text-muted-foreground/60">{modelShort}</span>
          </div>
        </div>

        {/* Handle labels — sit directly above the connection dots */}
        <div className="flex justify-between px-4 pb-3.5 pt-2">
          <span className="text-[9px] font-semibold text-violet-400/70 uppercase tracking-widest ml-1">
            Knowledge
          </span>
          <span className="text-[9px] font-semibold text-primary/50 uppercase tracking-widest mr-1">
            Tools
          </span>
        </div>

        {/* Hover hint */}
        <p className="text-[9px] text-muted-foreground/0 group-hover:text-muted-foreground/30 text-center pb-2 transition-colors duration-200">
          double-click to edit
        </p>

        {/* Bottom-left → Knowledge */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-left"
          style={{ left: "28%" }}
          className="!bg-violet-400 !w-2.5 !h-2.5 !border-2 !border-card"
        />
        {/* Bottom-right → Tools */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom-right"
          style={{ left: "72%" }}
          className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-card"
        />
      </div>
    </div>
  );
});
