"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to INSERT / UPDATE events on `channel_conversations` for a set of
 * channel IDs.  When any conversation changes (new message, status change, new
 * conversation) we call `onUpdate` so the parent can re-fetch its list.
 *
 * This is intentionally lightweight — the parent still owns the list state and
 * the fetch logic; this hook just tells it "something changed".
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

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_conversations",
        },
        () => onUpdateRef.current()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "channel_conversations",
        },
        () => onUpdateRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscriptionKey]);
}
