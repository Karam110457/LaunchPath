"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePortal } from "@/contexts/PortalContext";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { useConversationListRealtime } from "@/hooks/useConversationListRealtime";
import { ConversationControls } from "./ConversationControls";
import { LiveTranscript } from "./LiveTranscript";
import { Search, MessageSquare, ChevronLeft, User, Mail, Star, AlertTriangle, Info, PanelRightClose, PanelRightOpen } from "lucide-react";
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
  campaign_id: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface PortalInboxProps {
  campaigns: Array<{ id: string; name: string }>;
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
      className="px-4 py-3 space-y-2 animate-in fade-in duration-200"
      style={{ "--stagger": index, animationDelay: `${index * 50}ms` } as React.CSSProperties}
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
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "flex animate-in fade-in duration-200",
              i % 2 === 0 ? "justify-end" : "justify-start"
            )}
            style={{ animationDelay: `${(i + 1) * 80}ms` } as React.CSSProperties}
          >
            <Skeleton
              className={cn(
                "rounded-2xl",
                i % 2 === 0 ? "h-10 w-48" : "h-14 w-64"
              )}
            />
          </div>
        ))}
      </div>
      {/* Input skeleton */}
      <div className="border-t border-border/30 p-4 animate-in fade-in duration-200" style={{ animationDelay: "400ms" } as React.CSSProperties}>
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inbox component                                                            */
/* -------------------------------------------------------------------------- */

export function PortalInbox({ campaigns }: PortalInboxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { basePath, clientId } = usePortal();

  const selectedId = searchParams.get("id") ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // Track whether the filter changed (vs initial load) for transition animations
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [campaignId, setCampaignId] = useState(searchParams.get("campaignId") ?? "");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const prevFilterKey = useRef("");

  const campaignNameMap = new Map(campaigns.map((c) => [c.id, c.name]));

  const fetchConversations = useCallback(async () => {
    const params = new URLSearchParams();
    if (campaignId) params.set("campaignId", campaignId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    params.set("limit", String(limit));
    params.set("offset", String(offset));

    try {
      const res = await fetch(`/api/portal/conversations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setTotal(data.total);
      }
    } finally {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  }, [campaignId, status, search, offset]);

  // Detect filter changes and apply transition
  useEffect(() => {
    const filterKey = `${campaignId}|${status}|${search}|${offset}`;
    if (prevFilterKey.current && prevFilterKey.current !== filterKey) {
      setIsTransitioning(true);
    }
    prevFilterKey.current = filterKey;
    fetchConversations();
  }, [fetchConversations]);

  // Realtime: re-fetch list when any conversation changes
  useConversationListRealtime(
    clientId ? `portal:${clientId}` : "",
    fetchConversations
  );

  useEffect(() => {
    setOffset(0);
  }, [campaignId, status, search]);

  function selectConversation(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.replace(`${basePath}/conversations?${params}`, { scroll: false });
  }

  function deselectConversation() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.replace(`${basePath}/conversations?${params}`, { scroll: false });
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
              className="w-full bg-white dark:bg-[#151515] border border-neutral-200/60 dark:border-[#2A2A2A] rounded-xl h-10 pl-9 pr-4 text-sm text-neutral-900 dark:text-neutral-200 shadow-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-200 dark:focus-visible:ring-[#2A2A2A] focus:outline-none transition-all duration-200"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-200 dark:focus-visible:ring-[#2A2A2A] transition-colors duration-200"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-neutral-200/60 dark:border-[#2A2A2A] bg-white dark:bg-[#151515] shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-200 dark:focus-visible:ring-[#2A2A2A] transition-colors duration-200"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="human_takeover">Takeover</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <ConversationItemSkeleton key={i} index={i} />
              ))}
            </div>
          ) : isTransitioning ? (
            <div className="divide-y divide-border animate-in fade-in duration-150">
              {Array.from({ length: 4 }).map((_, i) => (
                <ConversationItemSkeleton key={i} index={i} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No conversations found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border stagger-enter">
              {conversations.map((conv, i) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{ "--stagger": i } as React.CSSProperties}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-all duration-150",
                    "hover:bg-muted/50 active:scale-[0.99]",
                    selectedId === conv.id
                      ? "bg-muted/40 border-l-2 border-l-foreground"
                      : "border-l-2 border-l-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0 transition-colors duration-300",
                          STATUS_DOT[conv.status] ?? STATUS_DOT.active
                        )}
                      />
                      <span className="text-sm font-medium truncate">
                        {(conv.metadata as Record<string, unknown>)?.visitor_name
                          ? String((conv.metadata as Record<string, unknown>).visitor_name)
                          : conv.session_id.slice(0, 12)}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 transition-colors duration-300",
                        conv.status === "active" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        conv.status === "paused" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                        conv.status === "human_takeover" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        conv.status === "closed" && "bg-zinc-500/10 text-zinc-500",
                        !["active", "paused", "human_takeover", "closed"].includes(conv.status) && "bg-muted text-muted-foreground"
                      )}>
                        {STATUS_LABEL[conv.status] ?? conv.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatRelativeTime(conv.updated_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate pl-4">
                    {conv.last_message ?? "No messages yet"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 pl-4">
                    <span className="text-[10px] text-muted-foreground/60">
                      {conv.message_count} msg{conv.message_count !== 1 ? "s" : ""}
                    </span>
                    {conv.campaign_id && (
                      <>
                        <span className="text-muted-foreground/30">&middot;</span>
                        <span className="text-[10px] text-muted-foreground/60 truncate">
                          {campaignNameMap.get(conv.campaign_id) ?? ""}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {offset + 1}-{Math.min(offset + limit, total)} of {total}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1 text-xs font-medium rounded-full border border-border hover:bg-muted/50 transition-all duration-200 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-3 py-1 text-xs font-medium rounded-full border border-border hover:bg-muted/50 transition-all duration-200 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
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
            onBack={deselectConversation}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground animate-in fade-in duration-300">
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
/*  Inbox detail (right panel)                                                 */
/* -------------------------------------------------------------------------- */

function InboxDetail({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const { messages, status, metadata, isLoading, refresh } =
    useConversationRealtime(conversationId);
  const [showInfo, setShowInfo] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  const hasMetadata = !!(
    metadata.visitor_name ||
    metadata.visitor_email ||
    metadata.csat_rating ||
    metadata.escalation_reason ||
    metadata.handoff_summary
  );

  return (
    <div className="flex h-full animate-in fade-in slide-in-from-right-2 duration-200">
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-95"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex-1 min-w-0">
            <ConversationControls
              conversationId={conversationId}
              status={status}
              onStatusChange={() => refresh()}
            />
          </div>
          <span className="text-xs text-muted-foreground animate-in fade-in duration-300">
            {messages.length} msg{messages.length !== 1 ? "s" : ""}
          </span>
          {hasMetadata && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={cn(
                "p-1.5 rounded-full transition-all duration-200 active:scale-95",
                showInfo
                  ? "text-foreground bg-muted/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title="Visitor info"
            >
              {showInfo ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
            </button>
          )}
        </div>

        {/* Transcript + input */}
        <div className="flex-1 min-h-0">
          <LiveTranscript
            conversationId={conversationId}
            messages={messages}
            status={status}
          />
        </div>
      </div>

      {/* Metadata sidebar */}
      {showInfo && hasMetadata && (
        <div className="w-[240px] border-l border-border bg-muted/20 overflow-y-auto flex-shrink-0 animate-in slide-in-from-right-4 duration-200 hidden lg:block">
          <div className="p-4 space-y-5">
            {/* Visitor Info */}
            {(metadata.visitor_name || metadata.visitor_email) && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Visitor
                </h4>
                {metadata.visitor_name && (
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="text-xs truncate">{metadata.visitor_name}</span>
                  </div>
                )}
                {metadata.visitor_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="text-xs truncate">{metadata.visitor_email}</span>
                  </div>
                )}
              </div>
            )}

            {/* CSAT Rating */}
            {metadata.csat_rating != null && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Satisfaction
                </h4>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        "size-3.5",
                        n <= (metadata.csat_rating ?? 0)
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    {metadata.csat_rating}/5
                  </span>
                </div>
                {metadata.csat_feedback && (
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    &ldquo;{metadata.csat_feedback}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Escalation */}
            {metadata.escalation_reason && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Escalation
                </h4>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-xs">
                    {metadata.escalation_reason === "explicit_request"
                      ? "Visitor requested a human"
                      : metadata.escalation_reason === "loop_detected"
                      ? "Loop detected (repeated messages)"
                      : String(metadata.escalation_reason)}
                  </span>
                </div>
                {metadata.escalated_at && (
                  <span className="text-[10px] text-muted-foreground/60 block pl-5">
                    {new Date(metadata.escalated_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Handoff Summary */}
            {metadata.handoff_summary && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Handoff Summary
                </h4>
                <div className="flex items-start gap-2">
                  <Info className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {metadata.handoff_summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
