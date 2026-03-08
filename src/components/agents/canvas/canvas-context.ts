"use client";

import { createContext } from "react";

/**
 * Context for canvas-level actions that child nodes need to trigger.
 * Provided in AgentCanvasPage, consumed by SubagentNode and DashedEdge.
 */
export const CanvasActionsContext = createContext<{
  /** Open the tool catalog scoped to a specific agent (parent or sub-agent). */
  openCatalogForAgent: (agentId: string) => void;
  /** Delete an edge by ID — handles tool disable, undo, persist, and toast. */
  onDeleteEdge: (edgeId: string) => void;
}>({
  openCatalogForAgent: () => {},
  onDeleteEdge: () => {},
});
