"use client";

import { useState } from "react";
import { BookOpen, FileText, Globe, HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RagSource } from "@/lib/chat/agent-chat-types";

const SOURCE_ICONS: Record<string, typeof FileText> = {
  file: FileText,
  website: Globe,
  faq: HelpCircle,
};

interface KnowledgeSourcesDisplayProps {
  sources: RagSource[];
}

export function KnowledgeSourcesDisplay({
  sources,
}: KnowledgeSourcesDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] transition-colors",
          "bg-blue-500/5 border-blue-500/20 text-blue-400/80 hover:bg-blue-500/10"
        )}
      >
        <BookOpen className="w-3 h-3 text-blue-400/70 shrink-0" />
        <span>Sources</span>
        <span className="text-blue-400/50">{sources.length}</span>
        <ChevronDown
          className={cn(
            "w-3 h-3 text-blue-400/50 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="mt-1.5 rounded-xl border border-blue-500/15 bg-blue-500/[0.03] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="max-h-[160px] overflow-y-auto py-1 px-1 space-y-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-blue-500/20">
            {sources.map((source) => {
              const Icon = SOURCE_ICONS[source.type] ?? FileText;
              const pct = Math.round(source.similarity * 100);
              return (
                <div
                  key={source.documentId}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] hover:bg-blue-500/5 transition-colors"
                >
                  <Icon className="w-3 h-3 text-blue-400/60 shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-blue-400/80">
                    {source.name}
                  </span>
                  <span className="text-blue-400/40 shrink-0 tabular-nums">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
