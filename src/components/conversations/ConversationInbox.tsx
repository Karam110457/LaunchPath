"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Search, MessageSquare, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversationTranscript } from "./ConversationTranscript";

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

interface ConversationDetail {
  id: string;
  session_id: string;
  messages: Array<{ role: string; content: string }>;
  metadata: Record<string, unknown> | null;
  created_at: string;
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
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No conversations found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
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
            conversationId={selectedId}
            clientId={clientId}
            onBack={deselectConversation}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
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
/*  Detail panel                                                               */
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
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/clients/${clientId}/conversations/${conversationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.conversation) setDetail(data.conversation);
      })
      .finally(() => setIsLoading(false));
  }, [conversationId, clientId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Conversation not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-background/80 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Session {detail.session_id.slice(0, 12)}</p>
          <p className="text-xs text-muted-foreground">
            {detail.messages.length} message{detail.messages.length !== 1 ? "s" : ""} &middot; Started {new Date(detail.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ConversationTranscript
          messages={detail.messages}
          metadata={detail.metadata}
          createdAt={detail.created_at}
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
