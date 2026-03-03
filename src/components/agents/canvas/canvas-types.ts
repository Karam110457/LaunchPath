// Data payload for the central agent node
export interface AgentNodeData {
  agentId: string;
  name: string;
  description: string | null;
  model: string;
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

// Data payload for a single tool node on the canvas
export interface ToolNodeData {
  toolId: string;
  agentId: string;
  toolType: string;
  displayName: string;
  isEnabled: boolean;
}

// Data payload for the "Add Tool" button node
export interface AddToolNodeData {
  agentId: string;
}

// Structured wizard configuration (stored in ai_agents.wizard_config JSONB)
export interface WizardConfig {
  templateId: "appointment-booker" | "customer-support";
  businessDescription?: string;
  qualifyingQuestions?: string[];
  behaviorConfig: Record<string, unknown>;
  personality: { tone: string; greeting_message: string };
}

// Lifted form state for agent editing (shared between edit panel + TopBar save)
export interface AgentFormState {
  name: string;
  description: string;
  avatarEmoji: string;
  tone: string;
  greetingMessage: string;
  model: string;
  status: string;
  systemPrompt: string;
  wizardConfig: WizardConfig | null;
}

// Panel state: which panel is open and what data it needs
export type PanelState =
  | { type: "none" }
  | { type: "knowledge" }
  | { type: "edit-agent" };
