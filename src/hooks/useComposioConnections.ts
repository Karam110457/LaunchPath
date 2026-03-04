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

export interface ComposioConnectError {
  toolkit: string;
  code?: string;
  message: string;
  requiredFields?: { name: string; displayName: string; description: string }[];
  availableSchemes?: { mode: string; needsDevSetup: boolean }[];
  /** The auth scheme detected by the backend (e.g. "API_KEY", "OAUTH2") */
  authScheme?: string;
}

interface UseComposioConnectionsReturn {
  connections: ComposioConnection[];
  loading: boolean;
  connecting: string | null; // toolkit currently being connected
  connectError: ComposioConnectError | null;
  clearConnectError: () => void;
  refresh: () => Promise<void>;
  connect: (toolkit: string, toolkitName: string, toolkitIcon?: string, authScheme?: string, customCredentials?: Record<string, string>) => Promise<void>;
  disconnect: (connectionId: string) => Promise<void>;
  isConnected: (toolkit: string) => boolean;
  getConnection: (toolkit: string) => ComposioConnection | undefined;
}

/**
 * Polls the verify endpoint until the connection is active or we give up.
 *
 * Returns:
 *  - "active" if the connection became active
 *  - "popup_closed" if the popup was closed without completing
 *  - "timeout" if we exceeded max attempts
 *  - "aborted" if the signal was aborted (e.g. user started a new connection)
 */
async function pollUntilActive(
  toolkit: string,
  popup: Window | null,
  signal: AbortSignal,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<"active" | "popup_closed" | "timeout" | "aborted"> {
  let attempts = 0;
  let popupClosedAt = 0;

  while (!signal.aborted && attempts < maxAttempts) {
    attempts++;

    // Wait before each check (except the first — give a moment for redirect)
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, intervalMs);
      signal.addEventListener("abort", () => { clearTimeout(timer); resolve(undefined); }, { once: true });
    });

    if (signal.aborted) return "aborted";

    // Track when popup closes
    const popupClosed = !popup || popup.closed;
    if (popupClosed && popupClosedAt === 0) {
      popupClosedAt = attempts;
    }

    // If popup has been closed for 2 polls (~4 seconds), give up.
    // This gives enough time for the OAuth callback to process while
    // not making the user wait 10+ seconds staring at "Connecting...".
    if (popupClosed && popupClosedAt > 0 && attempts - popupClosedAt > 2) {
      return "popup_closed";
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
          return "active";
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "aborted";
      // Other fetch errors — retry on next interval
    }
  }

  return signal.aborted ? "aborted" : "timeout";
}

export function useComposioConnections(): UseComposioConnectionsReturn {
  const [connections, setConnections] = useState<ComposioConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<ComposioConnectError | null>(null);
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
    async (toolkit: string, toolkitName: string, toolkitIcon?: string, authScheme?: string, customCredentials?: Record<string, string>) => {
      // Cancel any previous polling
      abortRef.current?.abort();

      setConnecting(toolkit);
      setConnectError(null);

      try {
        const res = await fetch("/api/composio/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolkit, toolkitName, toolkitIcon, authScheme, customCredentials }),
        });

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
            requiredFields?: { name: string; displayName: string; description: string }[];
            availableSchemes?: { mode: string; needsDevSetup: boolean }[];
            authScheme?: string;
          };
          setConnectError({
            toolkit,
            code: errData.code,
            message: errData.error ?? "Failed to initiate connection",
            requiredFields: errData.requiredFields,
            availableSchemes: errData.availableSchemes,
            authScheme: errData.authScheme,
          });
          setConnecting(null);
          return;
        }

        const data = (await res.json()) as {
          redirectUrl: string | null;
          status?: string;
        };

        // No-auth or API_KEY apps connected immediately — no popup needed
        if (!data.redirectUrl || data.status === "active") {
          await fetchConnections();
          setConnecting(null);
          return;
        }

        // Open auth popup
        const popup = window.open(
          data.redirectUrl,
          `composio_connect_${toolkit}`,
          "width=600,height=700,scrollbars=yes"
        );

        // Popup blocked by browser
        if (!popup) {
          setConnectError({
            toolkit,
            message: "Popup was blocked by your browser. Please allow popups for this site and try again.",
          });
          setConnecting(null);
          return;
        }

        // Poll for connection completion
        const controller = new AbortController();
        abortRef.current = controller;

        const result = await pollUntilActive(toolkit, popup, controller.signal);

        // Only update state if this controller wasn't replaced by a newer connect() call
        if (!controller.signal.aborted) {
          await fetchConnections();
          setConnecting(null);

          if (result === "popup_closed") {
            // Check one final time if the connection actually succeeded
            // (the OAuth callback might have processed right as the popup closed)
            const finalCheck = await fetch("/api/composio/connections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ toolkit }),
            }).then((r) => r.ok ? r.json() as Promise<{ status: string }> : null).catch(() => null);

            if (finalCheck?.status !== "active") {
              setConnectError({
                toolkit,
                message: "Connection window was closed before completing. Please try again.",
              });
            } else {
              // Actually succeeded — refresh connections
              await fetchConnections();
            }
          } else if (result === "timeout") {
            setConnectError({
              toolkit,
              message: "Connection timed out. Please try again.",
            });
          }
        }
      } catch (err) {
        setConnecting(null);
        setConnectError({
          toolkit,
          message: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
        });
      }
    },
    [fetchConnections]
  );

  const disconnect = useCallback(
    async (connectionId: string) => {
      const res = await fetch(`/api/composio/connections?id=${connectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      }
      // If delete failed, don't remove from local state — user will see it persists
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
