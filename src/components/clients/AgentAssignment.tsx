"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface Agent {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  agent_id: string;
  ai_agents: { id: string; name: string } | null;
}

interface AgentAssignmentProps {
  clientId: string;
  allAgents: Agent[];
}

export function AgentAssignment({ clientId, allAgents }: AgentAssignmentProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  async function fetchAssignments() {
    const res = await fetch(`/api/clients/${clientId}/agents`);
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.agents);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchAssignments();
  }, [clientId]);

  const assignedIds = new Set(assignments.map((a) => a.agent_id));
  const unassigned = allAgents.filter((a) => !assignedIds.has(a.id));

  async function handleAssign(agentId: string) {
    setIsAssigning(true);
    const res = await fetch(`/api/clients/${clientId}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });
    if (res.ok) {
      await fetchAssignments();
    }
    setIsAssigning(false);
  }

  async function handleUnassign(agentId: string) {
    const res = await fetch(`/api/clients/${clientId}/agents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });
    if (res.ok) {
      await fetchAssignments();
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Assigned Agents</h2>
        <p className="text-xs text-muted-foreground">
          Agents the client can use for campaigns
        </p>
      </div>

      {/* Assigned agents */}
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No agents assigned yet. Assign agents so the client can create campaigns.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assignments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-muted font-medium"
            >
              {a.ai_agents?.name ?? "Unknown"}
              <button
                onClick={() => handleUnassign(a.agent_id)}
                className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add agent */}
      {unassigned.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            id="agent-assign-select"
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background flex-1"
            defaultValue=""
          >
            <option value="" disabled>
              Select an agent to assign...
            </option>
            {unassigned.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const select = document.getElementById("agent-assign-select") as HTMLSelectElement;
              if (select?.value) handleAssign(select.value);
            }}
            disabled={isAssigning}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="size-4" />
            Assign
          </button>
        </div>
      )}
    </div>
  );
}
