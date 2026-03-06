import type { ToolCatalogEntry } from "./types";

export const TOOL_CATALOG: ToolCatalogEntry[] = [
  // ------------------------------------------------------------------
  // AUTOMATION
  // ------------------------------------------------------------------
  {
    type: "webhook",
    name: "Webhook",
    tagline: "Send data to any URL when the agent takes action — works with Zapier, Make, and more.",
    icon: "Webhook",
    category: "automation",
    defaultDisplayName: "Send to Webhook",
    defaultDescription:
      "Send data to an external webhook when relevant information is collected or an action should be triggered. Use this tool to notify external systems, trigger automations, or log data.",
    setupFields: [
      {
        key: "url",
        label: "Webhook URL",
        type: "url",
        placeholder: "https://hooks.zapier.com/hooks/catch/...",
        helpText:
          "The URL to POST data to. In Zapier: create a Zap with \"Webhooks by Zapier\" trigger → catch hook → copy the URL.",
        required: true,
      },
      {
        key: "secret",
        label: "Signing Secret (optional)",
        type: "password",
        placeholder: "my-secret-key",
        helpText:
          "If set, an HMAC-SHA256 signature is added as X-Webhook-Signature header so your server can verify authenticity.",
        required: false,
      },
    ],
  },

  {
    type: "http",
    name: "HTTP Request",
    tagline: "Call any REST API — your agent sends requests and reads the response.",
    icon: "Globe",
    category: "automation",
    defaultDisplayName: "API Request",
    defaultDescription:
      "Send HTTP requests to an external API to fetch data or trigger actions. Use this tool when you need to retrieve information or interact with a service.",
    setupFields: [
      {
        key: "url",
        label: "API URL",
        type: "url",
        placeholder: "https://api.example.com/v1/resource/{id}",
        helpText:
          "The endpoint URL. Use {param} for path parameters the AI can fill.",
        required: true,
      },
    ],
  },

  // ------------------------------------------------------------------
  // ADVANCED
  // ------------------------------------------------------------------
  {
    type: "mcp",
    name: "MCP Server",
    tagline: "Connect to any Model Context Protocol server and give your agent custom tools.",
    icon: "Plug",
    category: "advanced",
    defaultDisplayName: "MCP Tools",
    defaultDescription:
      "Use tools provided by the connected MCP server. The available actions depend on what the server exposes.",
    setupFields: [
      {
        key: "server_url",
        label: "MCP Server URL",
        type: "url",
        placeholder: "https://my-mcp-server.example.com/mcp",
        helpText:
          "The HTTP endpoint of your MCP server. Must support the Streamable HTTP transport (MCP spec §transport).",
        required: true,
      },
    ],
  },
];

export function getCatalogEntry(type: string): ToolCatalogEntry | undefined {
  return TOOL_CATALOG.find((e) => e.type === type);
}

export function getCatalogByCategory(): Record<string, ToolCatalogEntry[]> {
  const result: Record<string, ToolCatalogEntry[]> = {};
  for (const entry of TOOL_CATALOG) {
    if (!result[entry.category]) result[entry.category] = [];
    result[entry.category].push(entry);
  }
  return result;
}
