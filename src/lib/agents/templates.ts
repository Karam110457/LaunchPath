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
  wizard_hints?: {
    services_placeholder?: string;
    qualifying_questions_examples?: string[];
    business_description_placeholder?: string;
    support_topics_examples?: string[];
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
      "A support agent that resolves customer issues using the knowledge base. Asks clarifying questions, provides step-by-step solutions, and escalates to a human when it cannot resolve the issue.",
    default_tools: ["knowledge-base", "human-handoff"],
    suggested_personality: {
      tone: "patient and helpful",
      greeting_message:
        "Hi there! I'm here to help with any questions or issues.",
      avatar_emoji: "\u{1F6DF}",
    },
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
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}
