"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to INSERT / UPDATE events on `channel_conversations`.
 * When any conversation changes (new message, status change, new conversation)
 * we call `onUpdate` so the parent can re-fetch its list.
 *
 * Uses Realtime as primary with a polling fallback (every 5s) to handle cases
 * where complex RLS policies silently drop events.
 */
export function useConversationListRealtime(
  /** Stable channel name for the Supabase subscription */
  subscriptionKey: string,
  /** Called whenever a conversation row is inserted or updated */
  onUpdate: () => void,
) {
  const supabaseRef = useRef(createClient());
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!subscriptionKey) return;

    const supabase = supabaseRef.current;
    const channelName = `conv-list:${subscriptionKey}`;
    let realtimeFired = false;

    // Primary: Realtime subscription
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_conversations",
        },
        () => {
          realtimeFired = true;
          onUpdateRef.current();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "channel_conversations",
        },
        () => {
          realtimeFired = true;
          onUpdateRef.current();
        }
      )
      .subscribe();

    // Fallback: poll every 5s to catch missed Realtime events
    const pollInterval = setInterval(() => {
      if (realtimeFired) {
        // Realtime is working — skip this poll but reset flag
        // so we re-check next interval
        realtimeFired = false;
        return;
      }
      onUpdateRef.current();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [subscriptionKey]);
}
