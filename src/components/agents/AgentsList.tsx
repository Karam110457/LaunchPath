"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Copy, Trash2, Loader2, Search, Bot, Plus, Activity, Pause, FileEdit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
import { cn } from "@/lib/utils";

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
  userFullName?: string;
}

const STATUS_STYLES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "outline" },
};

const STATUS_FILTERS = ["all", "draft", "active", "paused"] as const;

export function AgentsList({ agents, userFullName = "there" }: AgentsListProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  const activeCount = agents.filter(a => a.status === "active").length;
  const draftCount = agents.filter(a => a.status === "draft").length;
  const pausedCount = agents.filter(a => a.status === "paused").length;

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
      const res = await fetch(`/api/agents/${agentId}/clone`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/agents/${data.id}`);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Welcome in, {userFullName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your fleet of AI agents.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="flex gap-4 md:gap-8 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 lg:pb-0 hide-scrollbar">
          <div className="flex items-center gap-4 shrink-0 px-4 py-3 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF8C00]/20 to-[#FF8C00]/5 flex items-center justify-center text-[#FF8C00]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-semibold leading-none">{agents.length}</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">Total Agents</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 px-4 py-3 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9D50BB]/20 to-[#9D50BB]/5 flex items-center justify-center text-[#9D50BB]">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-semibold leading-none">{activeCount}</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 px-4 py-3 rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FF8C00]/10 text-[#FF8C00]">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-semibold leading-none">{draftCount}</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border/40" />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="pl-10 h-10 rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-white/20 dark:border-white/5 focus-visible:ring-[#FF8C00]/50"
            />
          </div>
          <div className="flex bg-white/40 dark:bg-black/40 backdrop-blur-xl p-1 rounded-full border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto hide-scrollbar">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-full transition-all capitalize whitespace-nowrap",
                  statusFilter === s
                    ? "bg-foreground text-background shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <Button asChild className="rounded-full shadow-sm" size="lg">
          <Link href="/dashboard/agents/new">
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Link>
        </Button>
      </div>

      {/* Agent Cards Dashboard Wrapper */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-border/60 bg-card/30">
          <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
            {agents.length === 0
              ? "You haven't created any agents yet. Click 'New Agent' to get started."
              : "No agents match your current search and filter settings."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((agent) => {
            const statusInfo = STATUS_STYLES[agent.status] ?? STATUS_STYLES.draft;

            return (
              <Card
                key={agent.id}
                onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                className="group relative cursor-pointer outline-none overflow-hidden rounded-[32px] border border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.16)] hover:bg-white/60 dark:hover:bg-black/60 hover:-translate-y-1 transition-all duration-300"
              >
                <CardContent className="p-6 h-full flex flex-col justify-between min-h-[220px]">
                  {/* Top section: Icon and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#FF8C00]/20 to-[#9D50BB]/10 flex items-center justify-center shrink-0 border border-white/50 dark:border-white/5 shadow-inner">
                      <Bot className="w-7 h-7 text-[#FF8C00]" />
                    </div>
                    <Badge variant={statusInfo.variant} className="rounded-full px-3 shadow-sm border-white/20 dark:border-white/5 capitalize font-medium bg-background/50 backdrop-blur-md">
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Middle section: Info */}
                  <div className="flex-1 min-w-0 mb-4">
                    <h3 className="font-semibold text-xl mb-2 truncate group-hover:bg-[linear-gradient(135deg,#FF8C00,#9D50BB)] group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-foreground/70 dark:text-muted-foreground line-clamp-2 leading-relaxed">
                      {agent.description ?? "An unconfigured AI agent resting in your digital fleet."}
                    </p>
                  </div>

                  {/* Bottom section: Footer metadata & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
                    <div className="text-xs text-muted-foreground font-medium">
                      {new Date(agent.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>

                    {/* Actions — visible on hover (or touch) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleClone(agent.id, e)}
                        disabled={loadingAction === `clone-${agent.id}`}
                        className="p-2 rounded-full text-foreground/70 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/10 transition-all border border-transparent hover:border-white/20 bg-background/20 backdrop-blur-md shadow-sm"
                        title="Clone agent"
                      >
                        {loadingAction === `clone-${agent.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            disabled={loadingAction === `delete-${agent.id}`}
                            className="p-2 rounded-full text-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20 bg-background/20 backdrop-blur-md shadow-sm"
                            title="Delete agent"
                          >
                            {loadingAction === `delete-${agent.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()} className="rounded-[32px]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl">
                              Delete &ldquo;{agent.name}&rdquo;?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base text-muted-foreground">
                              This permanently deletes the agent, all connected knowledge tools, and conversation history. You cannot undo this action.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => handleDelete(agent.id, e)}
                              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Agent
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
