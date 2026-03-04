export type ToolType =
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
  toolkit_icon?: string;      // Logo URL or single char fallback
  connection_id: string;      // FK to user_composio_connections.id
  enabled_actions?: string[]; // e.g. ["GMAIL_SEND_EMAIL"] — undefined = all important actions
  /** Per-action parameter configuration. Keys are action slugs. */
  action_configs?: Record<string, ActionConfig>;
}

/** Configuration for a single Composio action — fixed and default parameter values. */
export interface ActionConfig {
  /** Hardcoded: stripped from schema, always injected. AI never sees these. */
  pinned_params: Record<string, unknown>;
  /** Defaults: kept in schema, injected only if AI doesn't provide a value. */
  default_params?: Record<string, unknown>;
}

// ------------------------------------------------------------------
// Composio action schemas (enriched API response)
// ------------------------------------------------------------------

export interface ComposioActionSchema {
  slug: string;
  name: string;
  description: string;
  isImportant: boolean;
  inputSchema?: {
    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
  // Action-level metadata from Composio API
  isDeprecated?: boolean;
  noAuth?: boolean;
  scopes?: string[];
  tags?: string[];
  outputSchema?: Record<string, JsonSchemaProperty>;
}

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  title?: string;
  // Format hints
  format?: string;              // "date-time", "date", "time", "email", "uri"
  // Array / object
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  // Validation constraints
  examples?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // Special
  const?: unknown;              // fixed value — not editable
  nullable?: boolean;
  deprecated?: boolean;
  // Composition
  oneOf?: JsonSchemaProperty[];
  anyOf?: JsonSchemaProperty[];
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

export type ToolCategory = "automation" | "advanced";

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
