"use client";

import { Badge } from "@/components/ui/badge";

interface AgentDetailPanelProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    system_prompt: string;
    model: string;
    status: string;
    created_at: string;
  };
  personality: {
    tone?: string;
    greeting_message?: string;
    avatar_emoji?: string;
  } | null;
}

export function AgentDetailPanel({
  agent,
  personality,
}: AgentDetailPanelProps) {
  return (
    <div className="p-5 space-y-6">
      {/* Personality */}
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Personality
        </h3>
        {personality?.tone && (
          <div>
            <span className="text-xs text-muted-foreground">Tone</span>
            <p className="text-sm mt-0.5">{personality.tone}</p>
          </div>
        )}
        {personality?.greeting_message && (
          <div>
            <span className="text-xs text-muted-foreground">Greeting</span>
            <p className="text-sm mt-0.5 italic">
              &ldquo;{personality.greeting_message}&rdquo;
            </p>
          </div>
        )}
      </section>

      <hr className="border-border" />

      {/* System Prompt */}
      <section className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          System Prompt
        </h3>
        <pre className="text-xs whitespace-pre-wrap bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
          {agent.system_prompt}
        </pre>
      </section>

      <hr className="border-border" />

      {/* Details */}
      <section className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Details
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant={agent.status === "active" ? "default" : "secondary"}
            >
              {agent.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Model</span>
            <span className="font-mono text-xs text-muted-foreground/80">
              {agent.model.replace("claude-", "").replace("-20250929", "")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{new Date(agent.created_at).toLocaleDateString()}</span>
          </div>
          {agent.description && (
            <div>
              <span className="text-muted-foreground">Description</span>
              <p className="text-sm mt-0.5">{agent.description}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
