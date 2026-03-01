"use client";

import { AgentKnowledgePanel } from "@/components/agents/AgentKnowledgePanel";

interface KnowledgeDetailPanelProps {
  agentId: string;
  initialDocuments: Array<{
    id: string;
    source_type: "file" | "website" | "faq";
    source_name: string;
    chunk_count: number;
    status: "processing" | "ready" | "error";
    error_message: string | null;
    created_at: string;
  }>;
}

export function KnowledgeDetailPanel({
  agentId,
  initialDocuments,
}: KnowledgeDetailPanelProps) {
  return (
    <div className="p-5">
      <AgentKnowledgePanel
        agentId={agentId}
        initialDocuments={initialDocuments}
      />
    </div>
  );
}
