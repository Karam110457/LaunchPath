"use client";

import { BookOpen, FileText, Globe, HelpCircle } from "lucide-react";
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
  if (sources.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap py-1">
      <BookOpen className="w-3 h-3 text-blue-400/70 shrink-0" />
      <span className="text-[10px] text-muted-foreground/70">Sources:</span>
      {sources.map((source) => {
        const Icon = SOURCE_ICONS[source.type] ?? FileText;
        const pct = Math.round(source.similarity * 100);
        return (
          <span
            key={source.documentId}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
              "bg-blue-500/5 border-blue-500/20 text-blue-400/80"
            )}
            title={`${source.name} (${pct}% match)`}
          >
            <Icon className="w-2.5 h-2.5" />
            <span className="max-w-[120px] truncate">{source.name}</span>
            <span className="text-blue-400/50">{pct}%</span>
          </span>
        );
      })}
    </div>
  );
}
