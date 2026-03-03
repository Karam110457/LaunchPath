"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Database, Loader2 } from "lucide-react";
import type { KnowledgeNodeData } from "../canvas-types";
import { NodeHelperTip } from "./NodeHelperTip";

export const KnowledgeNode = memo(function KnowledgeNode({ data }: NodeProps) {
  const d = data as unknown as KnowledgeNodeData;

  return (
    <div className="group relative flex flex-col items-center">
      {/* Circle container */}
      <div className="relative w-[96px] h-[96px] bg-[#1a1a1a] border border-[#333] rounded-full flex flex-col items-center justify-center cursor-pointer shadow-xl transition-all duration-200 hover:border-[#555] z-10">

        {/* Processing spinner inside circle */}
        {d.processingCount > 0 && (
          <div className="absolute top-1 right-1 z-10">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
        )}

        <div className="w-12 h-12 flex items-center justify-center">
          <Database className="w-8 h-8 text-violet-400" strokeWidth={1.5} />
        </div>

        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#111] !w-3 !h-3 !border-[1.5px] !border-[#555] !rounded-[2px] !rotate-45 !top-[-7px] z-20"
        />
      </div>

      {/* Text below */}
      <div className="mt-2.5 flex flex-col items-center pointer-events-none text-center">
        <h3 className="text-[14.5px] font-semibold text-[#EEEEEE] tracking-wide leading-tight">
          Knowledge Base
        </h3>
        <p className="text-[12px] text-[#777] mt-1">
          {d.documentCount === 1 ? "1 source" : `${d.documentCount} sources`}
        </p>
      </div>

      {/* Helper tip */}
      <NodeHelperTip
        tipId="knowledge"
        icon={<Database className="w-3.5 h-3.5 text-violet-400" />}
        text="Double-click to add documents, FAQs, and website content"
        position="left-[calc(100%+12px)] top-1/2 -translate-y-1/2"
      />
    </div>
  );
});
