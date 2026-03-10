"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePortal, usePortalCan } from "@/contexts/PortalContext";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { ConversationControls } from "./ConversationControls";
import { LiveTranscript } from "./LiveTranscript";
import { Search, MessageSquare, ChevronLeft } from "lucide-react";

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
/*  Inbox component                                                            */
/* -------------------------------------------------------------------------- */

export function PortalInbox({ campaigns }: PortalInboxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { basePath } = usePortal();

  // Selected conversation from URL
  const selectedId = searchParams.get("id") ?? null;

  // Conversation list state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [campaignId, setCampaignId] = useState(searchParams.get("campaignId") ?? "");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const campaignNameMap = new Map(campaigns.map((c) => [c.id, c.name]));

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
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
    }
  }, [campaignId, status, search, offset]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    setOffset(0);
  }, [campaignId, status, search]);

  // Select a conversation
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

  const selectClass =
    "px-3 py-2 text-sm rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150";

  return (
    <div className="flex h-full rounded-2xl border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 overflow-hidden">
      {/* ---- Left panel: Conversation list ---- */}
      <div
        className={`w-full md:w-[360px] lg:w-[400px] md:border-r border-border/30 flex flex-col shrink-0 ${
          selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Filters */}
        <div className="p-3 space-y-2 border-b border-border/30 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className={`${selectClass} w-full pl-9`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className={`${selectClass} flex-1 min-w-0`}
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
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
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-30" />
              No conversations found.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/20 hover:bg-muted/40 transition-colors duration-100 ${
                  selectedId === conv.id
                    ? "bg-muted/60 dark:bg-[#252525]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`size-2 rounded-full shrink-0 ${STATUS_DOT[conv.status] ?? STATUS_DOT.active}`}
                    />
                    <span className="text-sm font-medium truncate">
                      {conv.session_id.slice(0, 12)}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {formatRelativeTime(conv.updated_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate pl-4">
                  {conv.last_message ?? "No messages yet"}
                </p>
                <div className="flex items-center gap-2 mt-1 pl-4">
                  <span className="text-[10px] text-muted-foreground/70">
                    {conv.message_count} msg{conv.message_count !== 1 ? "s" : ""}
                  </span>
                  {conv.campaign_id && (
                    <>
                      <span className="text-muted-foreground/30">&middot;</span>
                      <span className="text-[10px] text-muted-foreground/70 truncate">
                        {campaignNameMap.get(conv.campaign_id) ?? ""}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground/30">&middot;</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    {STATUS_LABEL[conv.status] ?? conv.status}
                  </span>
                </div>
              </button>
            ))
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between p-3 border-t border-border/30">
              <span className="text-xs text-muted-foreground">
                {offset + 1}-{Math.min(offset + limit, total)} of {total}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1 text-xs rounded-lg border border-border/40 hover:bg-muted/50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-3 py-1 text-xs rounded-lg border border-border/40 hover:bg-muted/50 disabled:opacity-40"
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
        className={`flex-1 flex flex-col min-w-0 ${
          selectedId ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedId ? (
          <InboxDetail
            conversationId={selectedId}
            onBack={deselectConversation}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="size-10 mx-auto mb-3 opacity-20" />
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
  const { messages, status, isLoading, refresh } =
    useConversationRealtime(conversationId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1 min-w-0">
          <ConversationControls
            conversationId={conversationId}
            status={status}
            onStatusChange={() => refresh()}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
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
