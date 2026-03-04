/**
 * Hook for managing Composio app connections.
 *
 * Fetches user's connected apps, provides connect/disconnect/refresh actions,
 * and handles the OAuth popup lifecycle.
 *
 * Uses an AbortController to cleanly cancel polling when a new connect()
 * call is made or the component unmounts, preventing race conditions.
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
  connectError: { toolkit: string; code?: string; message: string } | null;
  clearConnectError: () => void;
  refresh: () => Promise<void>;
  connect: (toolkit: string, toolkitName: string, toolkitIcon?: string) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  isConnected: (toolkit: string) => boolean;
  getConnection: (toolkit: string) => ComposioConnection | undefined;
}

/**
 * Polls the verify endpoint until the connection is active or the abort signal fires.
 * Returns true if the connection became active, false otherwise.
 */
async function pollUntilActive(
  toolkit: string,
  popup: Window | null,
  signal: AbortSignal,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<boolean> {
  let attempts = 0;
  let popupClosedAt = 0;

  while (!signal.aborted && attempts < maxAttempts) {
    attempts++;

    // Wait before each check (except the first — give a moment for redirect)
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, intervalMs);
      // If aborted while waiting, resolve immediately
      signal.addEventListener("abort", () => { clearTimeout(timer); resolve(undefined); }, { once: true });
    });

    if (signal.aborted) return false;

    // Track when popup closes
    const popupClosed = !popup || popup.closed;
    if (popupClosed && popupClosedAt === 0) {
      popupClosedAt = attempts;
    }

    // If popup has been closed for a while and still not active, give up
    if (popupClosed && popupClosedAt > 0 && attempts - popupClosedAt > 5) {
      return false;
    }

    try {
      const verifyRes = await fetch("/api/composio/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit }),
        signal,
      });

      if (verifyRes.ok) {
        const verifyData = (await verifyRes.json()) as { status: string };
        if (verifyData.status === "active") {
          try { popup?.close(); } catch { /* cross-origin may block */ }
          return true;
        }
      }
    } catch (err) {
      // AbortError is expected — stop the loop
      if (err instanceof DOMException && err.name === "AbortError") return false;
      // Other fetch errors — retry on next interval
    }
  }

  return false;
}

export function useComposioConnections(): UseComposioConnectionsReturn {
  const [connections, setConnections] = useState<ComposioConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<{ toolkit: string; code?: string; message: string } | null>(null);
  // AbortController lets us cleanly cancel any in-flight polling
  const abortRef = useRef<AbortController | null>(null);

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

  // Clean up any active polling on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const connect = useCallback(
    async (toolkit: string, toolkitName: string, toolkitIcon?: string) => {
      // Cancel any previous polling (prevents race condition if user clicks
      // another app before the first one finishes)
      abortRef.current?.abort();

      setConnecting(toolkit);
      setConnectError(null);

      try {
        // 1. Get the auth redirect URL (OAuth or hosted API key page)
        const res = await fetch("/api/composio/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolkit, toolkitName, toolkitIcon }),
        });

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
          setConnectError({
            toolkit,
            code: errData.code,
            message: errData.error ?? "Failed to initiate connection",
          });
          setConnecting(null);
          return;
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

        // 3. Poll for connection completion using AbortController for clean cancellation
        const controller = new AbortController();
        abortRef.current = controller;

        const connected = await pollUntilActive(toolkit, popup, controller.signal);

        // Only update state if this controller wasn't replaced by a newer connect() call
        if (!controller.signal.aborted) {
          await fetchConnections();
          setConnecting(null);

          if (!connected) {
            // Popup closed without completing — not necessarily an error,
            // but reset the connecting state so user can try again
          }
        }
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

  const clearConnectError = useCallback(() => setConnectError(null), []);

  return {
    connections,
    loading,
    connecting,
    connectError,
    clearConnectError,
    refresh: fetchConnections,
    connect,
    disconnect,
    isConnected,
    getConnection,
  };
}
