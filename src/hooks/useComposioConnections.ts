/**
 * Hook for managing Composio app connections.
 *
 * Fetches user's connected apps, provides connect/disconnect/refresh actions,
 * and handles the OAuth popup lifecycle.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ComposioConnection {
  id: string;
  user_id: string;
  toolkit: string;
  toolkit_name: string;
  toolkit_icon: string | null;
  status: "pending" | "active" | "expired";
  composio_account_id: string | null;
  connected_at: string;
  updated_at: string;
}

interface UseComposioConnectionsReturn {
  connections: ComposioConnection[];
  loading: boolean;
  connecting: string | null; // toolkit currently being connected
  refresh: () => Promise<void>;
  connect: (toolkit: string, toolkitName: string, toolkitIcon?: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  isConnected: (toolkit: string) => boolean;
  getConnection: (toolkit: string) => ComposioConnection | undefined;
}

export function useComposioConnections(): UseComposioConnectionsReturn {
  const [connections, setConnections] = useState<ComposioConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/composio/connections");
      if (res.ok) {
        const data = (await res.json()) as { connections: ComposioConnection[] };
        setConnections(data.connections);
      }
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConnections();
  }, [fetchConnections]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const connect = useCallback(
    async (toolkit: string, toolkitName: string, toolkitIcon?: string) => {
      setConnecting(toolkit);

      try {
        // 1. Get the auth redirect URL (OAuth or hosted API key page)
        const res = await fetch("/api/composio/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolkit, toolkitName, toolkitIcon }),
        });

        if (!res.ok) {
          throw new Error("Failed to initiate connection");
        }

        const data = (await res.json()) as {
          redirectUrl: string | null;
          status?: string;
        };

        // No-auth apps are connected immediately — no popup needed
        if (!data.redirectUrl || data.status === "active") {
          await fetchConnections();
          setConnecting(null);
          return;
        }

        // 2. Open auth popup (works for both OAuth and API key hosted pages)
        const popup = window.open(
          data.redirectUrl,
          `composio_connect_${toolkit}`,
          "width=600,height=700,scrollbars=yes"
        );

        // 3. Poll continuously for connection completion.
        //    Verifies while popup is open (user may have completed auth)
        //    AND after popup closes. Gives up after max attempts.
        if (pollRef.current) clearInterval(pollRef.current);
        let attempts = 0;
        let isVerifying = false;
        const maxAttempts = 60; // ~2 minutes at 2s intervals
        let popupClosedAt = 0;

        pollRef.current = setInterval(async () => {
          // Prevent overlapping async verification calls
          if (isVerifying) return;
          isVerifying = true;

          try {
            attempts++;

            // Safety timeout — stop polling after max attempts
            if (attempts >= maxAttempts) {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
              await fetchConnections();
              setConnecting(null);
              return;
            }

            // Track when popup closes
            const popupClosed = !popup || popup.closed;
            if (popupClosed && popupClosedAt === 0) {
              popupClosedAt = attempts;
            }

            // Verify connection status with Composio
            const verifyRes = await fetch("/api/composio/connections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ toolkit }),
            });

            if (verifyRes.ok) {
              const verifyData = (await verifyRes.json()) as {
                status: string;
              };
              if (verifyData.status === "active") {
                // Success — close popup, stop polling, refresh connections
                try { popup?.close(); } catch { /* cross-origin may block */ }
                if (pollRef.current) clearInterval(pollRef.current);
                pollRef.current = null;
                await fetchConnections();
                setConnecting(null);
                return;
              }
            }

            // If popup has been closed for a while and still not active, stop
            if (popupClosed && attempts - popupClosedAt > 5) {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = null;
              await fetchConnections();
              setConnecting(null);
            }
          } catch {
            // Non-critical — will retry on next interval
          } finally {
            isVerifying = false;
          }
        }, 2000);
      } catch {
        setConnecting(null);
      }
    },
    [fetchConnections]
  );

  const disconnect = useCallback(
    async (connectionId: string) => {
      await fetch(`/api/composio/connections?id=${connectionId}`, {
        method: "DELETE",
      });
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    },
    []
  );

  const isConnected = useCallback(
    (toolkit: string) =>
      connections.some((c) => c.toolkit === toolkit && c.status === "active"),
    [connections]
  );

  const getConnection = useCallback(
    (toolkit: string) =>
      connections.find((c) => c.toolkit === toolkit && c.status === "active"),
    [connections]
  );

  return {
    connections,
    loading,
    connecting,
    refresh: fetchConnections,
    connect,
    disconnect,
    isConnected,
    getConnection,
  };
}
