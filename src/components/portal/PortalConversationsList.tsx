"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePortal } from "@/contexts/PortalContext";
import { ConversationFilters } from "./ConversationFilters";

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

interface PortalConversationsListProps {
  campaigns: Array<{ id: string; name: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  human_takeover: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  closed: "bg-zinc-500/10 text-zinc-500",
};

export function PortalConversationsList({ campaigns }: PortalConversationsListProps) {
  const { basePath } = usePortal();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [campaignId, setCampaignId] = useState(searchParams.get("campaignId") ?? "");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const campaignNameMap = new Map(campaigns.map((c) => [c.id, c.name]));

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

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [campaignId, status, search]);

  return (
    <div className="space-y-4">
      <ConversationFilters
        campaigns={campaigns}
        campaignId={campaignId}
        status={status}
        search={search}
        onCampaignChange={setCampaignId}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />

      {isLoading ? (
        <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-14 text-center text-muted-foreground animate-skeleton-pulse">
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 p-14 text-center text-muted-foreground">
          No conversations found.
        </div>
      ) : (
        <>
          <div className="rounded-[32px] border border-black/5 dark:border-[#2A2A2A] bg-[#f8f9fa] dark:bg-[#1E1E1E]/80 divide-y divide-border/30 overflow-hidden">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`${basePath}/conversations/${conv.id}`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors duration-150"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {conv.session_id.slice(0, 8)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[conv.status] ?? STATUS_COLORS.active}`}>
                      {conv.status === "human_takeover" ? "Takeover" : conv.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {conv.message_count} msg{conv.message_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.last_message ?? "No messages"}
                  </p>
                  {conv.campaign_id && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {campaignNameMap.get(conv.campaign_id) ?? ""}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-1.5 text-xs font-medium rounded-full border border-border/40 hover:bg-muted/50 transition-colors duration-150 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-1.5 text-xs font-medium rounded-full border border-border/40 hover:bg-muted/50 transition-colors duration-150 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
