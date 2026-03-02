"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";

export const AddToolNode = memo(function AddToolNode(_props: NodeProps) {
  return (
    <div className="group relative">
      <div className="absolute -inset-1.5 rounded-xl bg-amber-500/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />

      <div className="relative w-[185px] bg-card/50 border border-dashed border-border/50 rounded-xl p-3.5 cursor-pointer transition-all hover:border-amber-500/50 hover:bg-amber-500/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-dashed border-amber-500/30 flex items-center justify-center shrink-0 group-hover:border-amber-500/60 transition-colors">
            <Plus className="w-4 h-4 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
          </div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-amber-400 transition-colors">
            Add Tool
          </p>
        </div>

        <Handle
          type="target"
          position={Position.Left}
          className="!bg-border !w-2 !h-2 !border-2 !border-card"
        />
      </div>
    </div>
  );
});
