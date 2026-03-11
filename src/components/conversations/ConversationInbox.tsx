"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { useConversationListRealtime } from "@/hooks/useConversationListRealtime";
import { Search, MessageSquare, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface Conversation {
  id: string;
  session_id: string;
  status: string;
  message_count: number;
  last_message: string | null;
  campaign_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationInboxProps {
  campaigns: Array<{ id: string; name: string }>;
  clientId: string;
}

/* -------------------------------------------------------------------------- */
/*  Status config                                                              */
/* -------------------------------------------------------------------------- */

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  paused: "bg-amber-500",
  human_takeover: "bg-blue-500",
  closed: "bg-zinc-400",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  human_takeover: "Takeover",
  closed: "Closed",
};

/* -------------------------------------------------------------------------- */
/*  Skeleton components                                                        */
/* -------------------------------------------------------------------------- */

function ConversationItemSkeleton({ index }: { index: number }) {
  return (
    <div
      className="px-4 py-3 space-y-2"
      style={{ "--stagger": index } as React.CSSProperties}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
        <Skeleton className="h-3 w-8 rounded" />
      </div>
      <Skeleton className="h-3 w-3/4 rounded ml-4" />
      <div className="flex items-center gap-2 ml-4">
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
        <Skeleton className="h-5 w-28 rounded-md" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
            <Skeleton
              className={cn(
                "rounded-2xl",
                i % 2 === 0 ? "h-10 w-48" : "h-14 w-64"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inbox component                                                            */
/* -------------------------------------------------------------------------- */

export function ConversationInbox({ campaigns, clientId }: ConversationInboxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = `/dashboard/clients/${clientId}/conversations`;

  const selectedId = searchParams.get("id") ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [campaignId, setCampaignId] = useState("");
  const [search, setSearch] = useState("");

  const campaignNameMap = new Map(campaigns.map((c) => [c.id, c.name]));

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime: re-fetch list when any conversation changes
  useConversationListRealtime(
    clientId ? `agency:${clientId}` : "",
    fetchConversations
  );

  // Client-side filtering
  let filtered = conversations;
  if (campaignId) {
    filtered = filtered.filter((c) => c.campaign_name === campaignNameMap.get(campaignId));
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.last_message?.toLowerCase().includes(term) ||
        c.session_id.toLowerCase().includes(term)
    );
  }

  function selectConversation(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.replace(`${basePath}?${params}`, { scroll: false });
  }

  function deselectConversation() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.replace(`${basePath}?${params}`, { scroll: false });
  }

  return (
    <div className="flex h-full border border-black/5 dark:border-[#2A2A2A] rounded-[32px] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 overflow-hidden">
      {/* ---- Left panel: Conversation list ---- */}
      <div
        className={cn(
          "w-full md:w-[340px] lg:w-[380px] border-r border-border flex flex-col shrink-0",
          selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {/* Filters */}
        <div className="px-3 py-3 space-y-2 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white dark:bg-[#151515] border border-neutral-200/60 dark:border-[#2A2A2A] rounded-xl h-10 pl-9 pr-4 text-sm text-neutral-900 dark:text-neutral-200 shadow-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-200 dark:focus-visible:ring-[#2A2A2A] focus:outline-none"
            />
          </div>
          {campaigns.length > 1 && (
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-200 dark:focus-visible:ring-[#2A2A2A] transition-colors"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <ConversationItemSkeleton key={i} index={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground animate-in fade-in duration-300">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No conversations found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border stagger-enter">
              {filtered.map((conv, i) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{ "--stagger": i } as React.CSSProperties}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-all duration-150",
                    selectedId === conv.id && "bg-muted/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          STATUS_DOT[conv.status] ?? STATUS_DOT.active
                        )}
                      />
                      <span className="text-sm font-medium truncate">
                        {conv.session_id.slice(0, 12)}
                      </span>
                      {conv.status !== "active" && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                          {STATUS_LABEL[conv.status] ?? conv.status}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatRelativeTime(conv.updated_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate pl-4">
                    {conv.last_message ?? "No messages yet"}
                  </p>
                  {conv.campaign_name && (
                    <div className="flex items-center gap-2 mt-0.5 pl-4">
                      <span className="text-[10px] text-muted-foreground/60">
                        {conv.message_count} msg{conv.message_count !== 1 ? "s" : ""}
                      </span>
                      <span className="text-muted-foreground/30">&middot;</span>
                      <span className="text-[10px] text-muted-foreground/60 truncate">
                        {conv.campaign_name}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Right panel: Conversation detail ---- */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-background",
          selectedId ? "flex" : "hidden md:flex"
        )}
      >
        {selectedId ? (
          <InboxDetail
            key={selectedId}
            conversationId={selectedId}
            clientId={clientId}
            onBack={deselectConversation}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground animate-in fade-in duration-200">
            <div className="text-center">
              <MessageSquare className="size-10 mx-auto mb-3 opacity-15" />
              <p className="text-sm">Select a conversation to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail panel — now uses useConversationRealtime for live updates           */
/* -------------------------------------------------------------------------- */

function InboxDetail({
  conversationId,
  clientId,
  onBack,
}: {
  conversationId: string;
  clientId: string;
  onBack: () => void;
}) {
  const { messages, status, isLoading, refresh } =
    useConversationRealtime(conversationId);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            Session {conversationId.slice(0, 12)}
          </p>
          <p className="text-xs text-muted-foreground">
            {messages.length} message{messages.length !== 1 ? "s" : ""} &middot;{" "}
            <span className="inline-flex items-center gap-1">
              <span
                className={cn(
                  "size-1.5 rounded-full inline-block",
                  STATUS_DOT[status] ?? STATUS_DOT.active
                )}
              />
              {STATUS_LABEL[status] ?? status}
            </span>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {messages
            .filter((m) => ["user", "assistant", "human_agent"].includes(m.role))
            .map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm"
                      : msg.role === "human_agent"
                      ? "bg-blue-500/10 text-foreground border border-blue-500/20"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.role === "human_agent" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-600 mb-1">
                      Team
                    </span>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
