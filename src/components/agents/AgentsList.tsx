"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Copy, Trash2, Loader2, Search, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AgentListItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  personality: unknown;
  template_id: string | null;
  created_at: string;
}

interface AgentsListProps {
  agents: AgentListItem[];
}

const STATUS_STYLES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "outline" },
};

const STATUS_FILTERS = ["all", "draft", "active", "paused"] as const;

export function AgentsList({ agents }: AgentsListProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchesSearch =
        !search || a.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  const handleDelete = async (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAction(`delete-${agentId}`);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClone = async (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAction(`clone-${agentId}`);
    try {
      const res = await fetch(`/api/agents/${agentId}/clone`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/agents/${data.id}`);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {agents.length === 0
            ? "No agents yet. Create your first agent to get started."
            : "No agents match your search."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const statusInfo =
              STATUS_STYLES[agent.status] ?? STATUS_STYLES.draft;

            return (
              <div
                key={agent.id}
                onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                className="cursor-pointer"
              >
                <Card className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[24px] hover:border-primary/30 hover:shadow-lg transition-all h-full group relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{agent.name}</h3>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {agent.description ?? "No description"}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons — visible on hover */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleClone(agent.id, e)}
                        disabled={loadingAction === `clone-${agent.id}`}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        title="Clone agent"
                      >
                        {loadingAction === `clone-${agent.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            disabled={loadingAction === `delete-${agent.id}`}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete agent"
                          >
                            {loadingAction === `delete-${agent.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete &ldquo;{agent.name}&rdquo;?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This permanently deletes the agent, all knowledge
                              documents, and conversation history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => handleDelete(agent.id, e)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
