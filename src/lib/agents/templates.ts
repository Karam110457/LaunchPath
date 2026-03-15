// ---------------------------------------------------------------------------
// Suggested Composio tool spec (auto-added to agent on creation)
// ---------------------------------------------------------------------------

export interface SuggestedTool {
  /** Composio toolkit ID: "googlecalendar", "gmail", "googlesheets" */
  toolkit: string;
  /** Display name: "Google Calendar" */
  toolkitName: string;
  /** Tool display name shown on canvas */
  displayName: string;
  /** AI-facing description of what the tool does */
  description: string;
  /** Specific Composio actions to enable */
  actions: string[];
}

// ---------------------------------------------------------------------------
// Agent template definition
// ---------------------------------------------------------------------------

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  default_system_prompt_hint: string;
  suggested_personality: {
    tone: string;
    greeting_message: string;
  };
  /** Static tool workflow instructions — stored in ai_agents.tool_guidelines */
  toolWorkflow: string;
  /** Composio tools to auto-add when creating from this template */
  suggestedTools: SuggestedTool[];
  wizard_hints?: {
    services_placeholder?: string;
    qualifying_questions_examples?: string[];
    business_description_placeholder?: string;
    support_topics_examples?: string[];
  };
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "appointment-booker",
    name: "Appointment Booker",
    description:
      "Books meetings and captures lead details. Perfect for service businesses.",
    icon: "Calendar",
    default_system_prompt_hint:
      "An AI agent that qualifies leads by asking about their needs, then books appointments on the calendar. Captures the configured lead fields before booking. Keep responses concise, no more than 2 to 3 sentences. Ask only one question at a time. Never use emojis, markdown formatting, or dashes. Use natural, conversational language.",
    suggested_personality: {
      tone: "friendly and efficient",
      greeting_message:
        "Hi! I'd love to help you schedule an appointment. What service are you looking for?",
    },
    toolWorkflow: `## Tool Workflow — Appointment Booking

When booking an appointment, follow this exact sequence:
1. Use \`GOOGLECALENDAR_GET_CURRENT_DATE_TIME\` to get the current date and time
2. Use \`GOOGLECALENDAR_FIND_FREE_SLOTS\` to find available time slots
3. Present the available slots to the customer and let them choose
4. Use \`GOOGLECALENDAR_CREATE_EVENT\` to create the calendar event with all collected details
5. Use \`GMAIL_SEND_EMAIL\` to send a confirmation email to the customer with date, time, and appointment details

CRITICAL RULES:
- NEVER fabricate or guess availability — always check the calendar first
- NEVER book without confirming all details with the customer
- Collect all configured lead fields BEFORE attempting to book (see "Lead capture" directive above for which fields to collect)
- If no suitable times are available, offer to check alternative dates
- Include all relevant details in the calendar event description`,
    suggestedTools: [
      {
        toolkit: "googlecalendar",
        toolkitName: "Google Calendar",
        displayName: "Google Calendar",
        description: "Check availability and book appointments on the calendar",
        actions: [
          "GOOGLECALENDAR_GET_CURRENT_DATE_TIME",
          "GOOGLECALENDAR_FIND_FREE_SLOTS",
          "GOOGLECALENDAR_CREATE_EVENT",
        ],
      },
      {
        toolkit: "gmail",
        toolkitName: "Gmail",
        displayName: "Gmail",
        description: "Send appointment confirmation emails to customers",
        actions: ["GMAIL_SEND_EMAIL"],
      },
    ],
    wizard_hints: {
      services_placeholder:
        "e.g., Residential roof replacement, repair, inspection",
      qualifying_questions_examples: [
        "What type of service are you looking for?",
        "What's your preferred timeline?",
        "What's your budget range?",
      ],
    },
  },
  {
    id: "customer-support",
    name: "Customer Support",
    description:
      "Handles support queries using your knowledge base. Escalates complex issues.",
    icon: "LifeBuoy",
    default_system_prompt_hint:
      "A support agent that resolves customer issues using the knowledge base. Asks clarifying questions, provides clear solutions, and escalates to a human when it cannot resolve the issue. Keep responses concise, no more than 2 to 3 sentences. Ask only one question at a time. Never use emojis, markdown formatting, or dashes. Use natural, conversational language.",
    suggested_personality: {
      tone: "patient and helpful",
      greeting_message:
        "Hi there! I'm here to help with any questions or issues.",
    },
    toolWorkflow: `## Tool Workflow — Customer Support

When helping customers:
1. Always search your knowledge base FIRST before answering factual questions about the business
2. Use the \`search_knowledge_base\` tool for any questions about products, services, policies, or procedures
3. If the knowledge base doesn't have the answer, honestly tell the customer you'll need to check with the team
4. Never guess or fabricate information — accuracy builds trust

ESCALATION:
When a conversation needs to be escalated (account changes, billing, technical issues you can't resolve, or anything beyond your scope):
1. Collect the configured lead fields and a clear description of their issue (see "Lead capture" directive above for which fields to collect)
2. Let the customer know you're passing this to someone who can help
3. Use \`GMAIL_SEND_EMAIL\` to send an escalation email to the configured escalation contact with:
   - Subject: "Escalation: [brief issue summary]"
   - Body: Customer name, email, issue description, and any relevant conversation context
4. Confirm to the customer that the team has been notified and will follow up
- NEVER tell the customer to email someone themselves — always send the escalation email on their behalf`,
    suggestedTools: [
      {
        toolkit: "gmail",
        toolkitName: "Gmail",
        displayName: "Gmail",
        description: "Send escalation emails to the team when issues need human attention",
        actions: ["GMAIL_SEND_EMAIL"],
      },
    ],
    wizard_hints: {
      business_description_placeholder:
        "e.g., We sell project management software for small teams",
      support_topics_examples: [
        "Account & billing",
        "Feature requests",
        "Bug reports",
      ],
    },
  },
  {
    id: "lead-capture",
    name: "Lead Capture",
    description:
      "Captures lead details through conversation and saves them to a spreadsheet.",
    icon: "Target",
    default_system_prompt_hint:
      "An AI agent that engages visitors in helpful conversation while naturally collecting qualifying information. Saves lead data to Google Sheets and notifies the team via email. Keep responses concise, no more than 2 to 3 sentences. Ask only one question at a time. Never use emojis, markdown formatting, or dashes. Use natural, conversational language.",
    suggested_personality: {
      tone: "warm and conversational",
      greeting_message:
        "Hey there! I'd love to learn a bit about what you're looking for so I can point you in the right direction.",
    },
    toolWorkflow: `## Tool Workflow — Lead Qualification

As you collect lead information through natural conversation:
1. After collecting at least 2 of the configured lead fields (see "Lead capture" directive above), use \`GOOGLESHEETS_BATCH_UPDATE\` to save the partial lead data to the spreadsheet
2. Continue updating the spreadsheet row as you gather more details
3. When qualification is complete, use \`GMAIL_SEND_EMAIL\` to send an internal notification email to the team with a summary of the qualified lead
4. NEVER email the lead directly — notification emails are internal only

IMPORTANT RULES:
- Save partial data early — don't wait until you have everything
- Be conversational, not interrogative — gather information naturally through helpful dialogue
- Ask questions one at a time, never in a batch
- Show genuine interest in helping the visitor find the right solution
- If the visitor isn't a good fit, be honest and helpful about alternatives`,
    suggestedTools: [
      {
        toolkit: "googlesheets",
        toolkitName: "Google Sheets",
        displayName: "Google Sheets",
        description: "Save and update lead information in the spreadsheet",
        actions: ["GOOGLESHEETS_BATCH_UPDATE"],
      },
      {
        toolkit: "gmail",
        toolkitName: "Gmail",
        displayName: "Gmail",
        description: "Send internal lead notification emails to the team",
        actions: ["GMAIL_SEND_EMAIL"],
      },
    ],
    wizard_hints: {
      qualifying_questions_examples: [
        "What product or service are you interested in?",
        "What's your timeline for getting started?",
        "What's the size of your team or organization?",
      ],
    },
  },
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  // Backward compat: old "lead-qualification" ID maps to "lead-capture"
  const normalizedId = id === "lead-qualification" ? "lead-capture" : id;
  return AGENT_TEMPLATES.find((t) => t.id === normalizedId);
}
