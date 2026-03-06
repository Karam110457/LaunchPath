"use client";

import { createContext } from "react";

/**
 * Context for canvas-level actions that child nodes need to trigger.
 * Provided in AgentCanvasPage, consumed by SubagentNode.
 */
export const CanvasActionsContext = createContext<{
  /** Open the tool catalog scoped to a specific agent (parent or sub-agent). */
  openCatalogForAgent: (agentId: string) => void;
}>({
  openCatalogForAgent: () => {},
});
