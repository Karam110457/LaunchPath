export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  default_system_prompt_hint: string;
  default_tools: string[];
  suggested_personality: {
    tone: string;
    greeting_message: string;
    avatar_emoji: string;
  };
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "appointment-booker",
    name: "Appointment Booker",
    description:
      "Books meetings and captures lead details. Perfect for service businesses.",
    icon: "Calendar",
    default_system_prompt_hint:
      "An AI agent that qualifies leads by asking about their needs, then books appointments on the calendar. Captures name, email, and phone before booking.",
    default_tools: ["calendar", "lead-capture", "email"],
    suggested_personality: {
      tone: "friendly and efficient",
      greeting_message:
        "Hi! I'd love to help you schedule an appointment. What service are you looking for?",
      avatar_emoji: "\u{1F4C5}",
    },
  },
  {
    id: "receptionist",
    name: "Receptionist",
    description:
      "Answers questions from your knowledge base and routes to humans when needed.",
    icon: "Headphones",
    default_system_prompt_hint:
      "A virtual receptionist that greets visitors, answers frequently asked questions from the knowledge base, captures contact info, and escalates complex queries to a human.",
    default_tools: ["knowledge-base", "lead-capture", "human-handoff"],
    suggested_personality: {
      tone: "warm and professional",
      greeting_message: "Welcome! How can I help you today?",
      avatar_emoji: "\u{1F44B}",
    },
  },
  {
    id: "customer-support",
    name: "Customer Support",
    description:
      "Handles support queries using your knowledge base. Escalates complex issues.",
    icon: "LifeBuoy",
    default_system_prompt_hint:
      "A support agent that resolves customer issues using the knowledge base. Asks clarifying questions, provides step-by-step solutions, and escalates to a human when it cannot resolve the issue.",
    default_tools: ["knowledge-base", "human-handoff"],
    suggested_personality: {
      tone: "patient and helpful",
      greeting_message:
        "Hi there! I'm here to help with any questions or issues.",
      avatar_emoji: "\u{1F6DF}",
    },
  },
  {
    id: "sales-rep",
    name: "Sales Rep",
    description:
      "Qualifies prospects, answers objections, and captures contact info.",
    icon: "TrendingUp",
    default_system_prompt_hint:
      "A sales agent that qualifies prospects by understanding their pain points, answers common objections, explains the service benefits, and captures contact information for follow-up.",
    default_tools: ["knowledge-base", "lead-capture", "email"],
    suggested_personality: {
      tone: "confident and consultative",
      greeting_message:
        "Hey! I'd love to learn about your business and see if we can help.",
      avatar_emoji: "\u{1F4BC}",
    },
  },
  {
    id: "follow-up-agent",
    name: "Follow-up Agent",
    description:
      "Re-engages leads who haven't responded with timely follow-ups.",
    icon: "RefreshCw",
    default_system_prompt_hint:
      "An agent that follows up with prospects who haven't responded. Sends friendly check-in messages, provides additional value or information, and tries to re-engage the conversation.",
    default_tools: ["email", "lead-capture"],
    suggested_personality: {
      tone: "persistent but polite",
      greeting_message:
        "Just checking in! Did you have a chance to think about what we discussed?",
      avatar_emoji: "\u{1F504}",
    },
  },
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}
