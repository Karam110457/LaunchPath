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
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}
