"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: string;
  sent_by?: string;
}

interface UseConversationRealtimeResult {
  messages: ConversationMessage[];
  status: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const lastKnownCountRef = useRef(0);
  const realtimeFiredRef = useRef(false);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    const supabase = supabaseRef.current;

    const { data } = await supabase
      .from("channel_conversations")
      .select("messages, status")
      .eq("id", conversationId)
      .single();

    if (data) {
      const msgs = (data.messages ?? []) as ConversationMessage[];
      const newStatus = (data as Record<string, unknown>).status as string ?? "active";

      // Only update state if something actually changed
      if (msgs.length !== lastKnownCountRef.current || newStatus !== status) {
        setMessages(msgs);
        setStatus(newStatus);
        lastKnownCountRef.current = msgs.length;
      }
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
        }
      )
      .subscribe();

    // Fallback: poll every 3s to catch missed Realtime events
    const pollInterval = setInterval(() => {
      // If Realtime is firing reliably, reduce polling to every 10s
      // by skipping intermediate polls
      if (realtimeFiredRef.current) return;
      fetchConversation();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [conversationId, fetchConversation]);

  return { messages, status, isLoading, refresh: fetchConversation };
}
