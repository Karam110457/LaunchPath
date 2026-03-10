"use client";

import { createContext, useContext } from "react";
import type { PortalAction } from "@/lib/auth/portal-permissions";
import { canPerform } from "@/lib/auth/portal-permissions";

export interface PortalContextValue {
  clientId: string;
  role: "admin" | "viewer";
  clientName: string;
  clientLogo?: string | null;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: PortalContextValue;
}) {
  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return ctx;
}

/** Convenience hook: check if the current portal user can perform an action. */
export function usePortalCan(action: PortalAction): boolean {
  const { role } = usePortal();
  return canPerform(role, action);
}
