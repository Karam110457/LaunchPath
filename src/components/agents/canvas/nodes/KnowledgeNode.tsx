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
      <div className="relative w-[96px] h-[96px] liquid-glass-node !rounded-full flex flex-col items-center justify-center cursor-pointer z-10">

        {/* Processing spinner inside circle */}
        {d.processingCount > 0 && (
          <div className="absolute top-1 right-1 z-10">
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          </div>
        )}

        <div className="flex items-center justify-center">
          <Database className="w-8 h-8 text-violet-500" strokeWidth={1.5} />
        </div>

        <Handle
          type="target"
          position={Position.Top}
          className="!bg-zinc-200 !w-2.5 !h-2.5 !border-[1.5px] !border-white !rounded-full !top-[-5px] opacity-0 group-hover:opacity-100 transition-opacity z-20"
        />
      </div>

      {/* Text below */}
      <div className="mt-3 flex flex-col items-center pointer-events-none text-center max-w-[120px]">
        <h3 className="text-[13px] font-medium text-zinc-800 leading-tight flex-wrap">
          Knowledge Base
        </h3>
        <p className="text-[10px] text-zinc-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {d.documentCount === 1 ? "1 source" : `${d.documentCount} sources`}
        </p>
      </div>

      {/* Helper tip — anchored to the left side of the node */}
      <NodeHelperTip
        tipId="knowledge"
        icon={<Database className="w-3.5 h-3.5 text-violet-400" />}
        text="Double-click to add documents, FAQs, and website content"
        position="right-[calc(100%+16px)] top-1/2 -translate-y-1/2"
      />
    </div>
  );
});
