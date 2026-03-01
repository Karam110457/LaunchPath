// Data payload for the central agent node
export interface AgentNodeData {
  agentId: string;
  name: string;
  description: string | null;
  model: string;
  status: "draft" | "active" | "paused";
  avatarEmoji: string;
  tone: string | null;
  greetingMessage: string | null;
  systemPrompt: string;
}

// Data payload for the knowledge base node
export interface KnowledgeNodeData {
  agentId: string;
  documentCount: number;
  readyCount: number;
  processingCount: number;
}

// Data payload for each tool node
export interface ToolNodeData {
  toolId: string;
  label: string;
  description: string;
}

// Panel state: which panel is open and what data it needs
export type PanelState =
  | { type: "none" }
  | { type: "agent" }
  | { type: "knowledge" }
  | { type: "tool"; toolId: string }
  | { type: "chat" };
