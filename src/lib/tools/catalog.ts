import type { ToolCatalogEntry } from "./types";

export const TOOL_CATALOG: ToolCatalogEntry[] = [
  // ------------------------------------------------------------------
  // BOOKING
  // ------------------------------------------------------------------
  {
    type: "calendly",
    name: "Calendly",
    tagline: "Let your agent share your booking link when customers are ready to schedule.",
    icon: "CalendarCheck",
    category: "booking",
    defaultDisplayName: "Book a Call",
    defaultDescription:
      "Share a booking link when the customer expresses interest in scheduling an appointment, consultation, or call. Use this tool when someone asks to book, schedule, or set up a meeting.",
    setupFields: [
      {
        key: "booking_url",
        label: "Calendly Booking URL",
        type: "url",
        placeholder: "https://calendly.com/your-name/30min",
        helpText: "Go to Calendly → your event type → copy the link.",
        required: true,
      },
    ],
  },

  // ------------------------------------------------------------------
  // CRM
  // ------------------------------------------------------------------
  {
    type: "ghl",
    name: "GoHighLevel",
    tagline: "Automatically create contacts in your GoHighLevel CRM when leads are captured.",
    icon: "Users",
    category: "crm",
    defaultDisplayName: "Save Lead to GoHighLevel",
    defaultDescription:
      "Create a new contact in GoHighLevel CRM after collecting the lead's information. Use this tool once you have the customer's name, email, or phone number.",
    setupFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        placeholder: "eyJhbGciOi...",
        helpText:
          "In GoHighLevel: Settings → Business Profile → API Keys → Create Key. Copy the full token.",
        required: true,
      },
      {
        key: "location_id",
        label: "Location ID",
        type: "text",
        placeholder: "abc123XYZ...",
        helpText:
          "In GoHighLevel: Settings → Business Profile → scroll to Location ID (also shown in the URL as ?location_id=...).",
        required: true,
      },
    ],
  },
  {
    type: "hubspot",
    name: "HubSpot",
    tagline: "Automatically create contacts in HubSpot when leads are captured.",
    icon: "Users",
    category: "crm",
    defaultDisplayName: "Save Lead to HubSpot",
    defaultDescription:
      "Create a new contact in HubSpot CRM after collecting the lead's information. Use this tool once you have the customer's name, email, or phone number.",
    setupFields: [
      {
        key: "access_token",
        label: "Private App Access Token",
        type: "password",
        placeholder: "pat-na1-...",
        helpText:
          "In HubSpot: Settings → Integrations → Private Apps → Create a private app. Under Scopes, enable crm.objects.contacts.write. Copy the access token.",
        required: true,
      },
    ],
  },

  // ------------------------------------------------------------------
  // COMMUNICATION
  // ------------------------------------------------------------------
  {
    type: "human-handoff",
    name: "Human Handoff",
    tagline: "Escalate to a real person when the agent can't help or the customer asks for one.",
    icon: "UserCheck",
    category: "communication",
    defaultDisplayName: "Transfer to Human",
    defaultDescription:
      "Transfer the conversation to a human agent when the customer is frustrated, has a complex issue, explicitly requests a person, or when you've reached the limit of what you can help with. Always summarize the conversation before handing off.",
    setupFields: [
      {
        key: "notify_email",
        label: "Notification Email (optional)",
        type: "email",
        placeholder: "you@example.com",
        helpText: "Receive an email alert whenever a handoff is triggered.",
        required: false,
      },
      {
        key: "webhook_url",
        label: "Webhook URL (optional)",
        type: "url",
        placeholder: "https://hooks.zapier.com/...",
        helpText:
          "POST a payload to this URL when a handoff occurs. Works with Zapier, Make, or any webhook handler.",
        required: false,
      },
    ],
  },

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
