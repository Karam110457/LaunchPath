"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: string;
  sent_by?: string;
  sent_by_name?: string;
}

export interface ConversationMetadata {
  visitor_name?: string | null;
  visitor_email?: string | null;
  csat_rating?: number | null;
  csat_feedback?: string | null;
  csat_submitted_at?: string | null;
  escalation_reason?: string | null;
  escalated_at?: string | null;
  handoff_summary?: string | null;
  handoff_at?: string | null;
  [key: string]: unknown;
}

interface UseConversationRealtimeResult {
  messages: ConversationMessage[];
  status: string;
  metadata: ConversationMetadata;
  isLoading: boolean;
  refresh: () => void;
}

/**
 * Subscribe to Supabase Realtime changes on a specific channel_conversation row.
 * Returns live messages and status updates.
 *
 * Uses Realtime as the primary channel with a polling fallback (every 3s)
 * to handle cases where complex RLS policies silently drop events.
 */
export function useConversationRealtime(
  conversationId: string | null
): UseConversationRealtimeResult {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [status, setStatus] = useState("active");
  const [metadata, setMetadata] = useState<ConversationMetadata>({});
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const lastKnownCountRef = useRef(0);
  const realtimeFiredRef = useRef(false);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    const supabase = supabaseRef.current;

    const { data } = await supabase
      .from("channel_conversations")
      .select("messages, status, metadata")
      .eq("id", conversationId)
      .single();

    if (data) {
      const row = data as Record<string, unknown>;
      const msgs = (row.messages ?? []) as ConversationMessage[];
      const newStatus = (row.status as string) ?? "active";
      const meta = (row.metadata ?? {}) as ConversationMetadata;

      // Only update state if something actually changed
      if (msgs.length !== lastKnownCountRef.current || newStatus !== status) {
        setMessages(msgs);
        setStatus(newStatus);
        lastKnownCountRef.current = msgs.length;
      }
      setMetadata(meta);
    }
    setIsLoading(false);
  }, [conversationId, status]);

  useEffect(() => {
    if (!conversationId) return;

    realtimeFiredRef.current = false;
    fetchConversation();

    const supabase = supabaseRef.current;
    const channelName = `conversation:${conversationId}`;

    // Primary: Realtime subscription
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "channel_conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          realtimeFiredRef.current = true;
          const newRow = payload.new as Record<string, unknown>;
          if (newRow.messages) {
            const msgs = newRow.messages as ConversationMessage[];
            setMessages(msgs);
            lastKnownCountRef.current = msgs.length;
          }
          if (newRow.status) {
            setStatus(newRow.status as string);
          }
          if (newRow.metadata) {
            setMetadata(newRow.metadata as ConversationMetadata);
          }
        }
      )
      .subscribe();

    // Fallback: poll every 3s to catch missed Realtime events.
    // If Realtime fired since the last poll, skip this cycle and reset
    // the flag so we resume polling if Realtime goes silent.
    const pollInterval = setInterval(() => {
      if (realtimeFiredRef.current) {
        realtimeFiredRef.current = false;
        return;
      }
      fetchConversation();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [conversationId, fetchConversation]);

  return { messages, status, metadata, isLoading, refresh: fetchConversation };
}
