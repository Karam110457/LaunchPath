export type ToolType =
  | "calendly"
  | "ghl"
  | "hubspot"
  | "webhook"
  | "mcp"
  | "composio";

// ------------------------------------------------------------------
// DB row shape (what we read from agent_tools)
// ------------------------------------------------------------------

export interface AgentToolRecord {
  id: string;
  agent_id: string;
  user_id: string;
  tool_type: ToolType;
  display_name: string;
  description: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------
// Per-tool config shapes
// ------------------------------------------------------------------

export interface CalendlyConfig {
  booking_url: string;
}

export interface GHLConfig {
  api_key: string;
  location_id: string;
}

export interface HubSpotConfig {
  access_token: string;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  include_conversation?: boolean;
}

export interface MCPConfig {
  server_url: string;
  // Cached after first successful connect — not user-supplied
  discovered_tools?: string[];
}

export interface ComposioToolConfig {
  toolkit: string;            // Composio toolkit slug e.g. "gmail", "hubspot"
  toolkit_name: string;       // Display name e.g. "Gmail"
  connection_id: string;      // FK to user_composio_connections.id
  enabled_actions?: string[]; // e.g. ["GMAIL_SEND_EMAIL"] — undefined = all important actions
}

// ------------------------------------------------------------------
// Setup UI field definitions
// ------------------------------------------------------------------

export type FieldType = "text" | "url" | "password" | "email" | "textarea" | "toggle";

export interface ToolSetupField {
  key: string;
  label: string;
  type: FieldType;
  placeholder: string;
  helpText?: string;
  required: boolean;
}

// ------------------------------------------------------------------
// Tool catalog entry — defines a tool type available for agents
// ------------------------------------------------------------------

export type ToolCategory = "booking" | "crm" | "communication" | "automation" | "advanced";

export interface ToolCatalogEntry {
  type: ToolType;
  name: string;
  tagline: string;
  icon: string;           // Lucide icon component name
  category: ToolCategory;
  setupFields: ToolSetupField[];
  defaultDisplayName: string;
  defaultDescription: string;  // Pre-filled Claude-facing description
}

// ------------------------------------------------------------------
// API response shapes (config is masked — no raw secrets to client)
// ------------------------------------------------------------------

export interface AgentToolResponse {
  id: string;
  agent_id: string;
  tool_type: ToolType;
  display_name: string;
  description: string;
  config: Record<string, unknown>;  // Keys masked: "••••abcd"
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateToolPayload {
  tool_type: ToolType;
  display_name: string;
  description: string;
  config: Record<string, unknown>;
}

export interface UpdateToolPayload {
  display_name?: string;
  description?: string;
  config?: Record<string, unknown>;
  is_enabled?: boolean;
}

export interface TestToolPayload {
  tool_type: ToolType;
  config: Record<string, unknown>;
}

export interface TestToolResult {
  success: boolean;
  message: string;
  details?: unknown;
}

export interface MCPDiscoveredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}
