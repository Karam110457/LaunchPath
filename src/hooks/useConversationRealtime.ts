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
 */
export function useConversationRealtime(
  conversationId: string | null
): UseConversationRealtimeResult {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [status, setStatus] = useState("active");
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  const fetchConversation = useCallback(async () => {
    if (!conversationId) return;
    const supabase = supabaseRef.current;

    const { data } = await supabase
      .from("channel_conversations")
      .select("messages, status")
      .eq("id", conversationId)
      .single();

    if (data) {
      setMessages((data.messages ?? []) as ConversationMessage[]);
      setStatus((data as Record<string, unknown>).status as string ?? "active");
    }
    setIsLoading(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    fetchConversation();

    const supabase = supabaseRef.current;
    const channelName = `conversation:${conversationId}`;

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
          const newRow = payload.new as Record<string, unknown>;
          if (newRow.messages) {
            setMessages(newRow.messages as ConversationMessage[]);
          }
          if (newRow.status) {
            setStatus(newRow.status as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchConversation]);

  return { messages, status, isLoading, refresh: fetchConversation };
}
