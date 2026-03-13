/**
 * Agent builder system prompt + context builder.
 * Used by the agent-builder Mastra agent to generate agent configs from user prompts.
 */

export const AGENT_BUILDER_SYSTEM_PROMPT = `You are LaunchPath's Agent Builder AI. Your job is to generate a complete AI agent configuration based on the user's description.

You will receive a description of what kind of agent the user wants. You must generate:

1. **name** — A short, professional agent name (2-4 words). Examples: "Apex Roofing Assistant", "Solar Lead Qualifier", "Booking Bot". Make it specific to the use case, not generic.

2. **description** — A single sentence describing what this agent does. Be specific and action-oriented.

3. **system_prompt** — A detailed, production-ready system prompt that will instruct the runtime AI agent. This should be 150-300 words and include:
   - The agent's role and identity (who it is, what business it represents)
   - Business-specific knowledge (services, location, expertise, awards, policies — drawn from website facts and FAQs)
   - Conversation approach (how to engage visitors, what to ask about, how to guide the conversation)
   - Boundaries (what NOT to do, what to avoid)
   The system prompt should be written as direct instructions to the agent (second person: "You are...", "You should...").

4. **personality** — An object with:
   - tone: A short phrase describing communication style (e.g. "friendly and efficient", "warm and professional")
   - greeting_message: The first message the agent sends when a conversation starts (1-2 sentences)

CRITICAL — WHAT NOT TO INCLUDE IN system_prompt:
A "Configuration Directives" section is automatically appended to your system_prompt after generation. It precisely covers:
- Communication tone and language
- Which lead fields to collect (name, email, phone, etc.)
- Scheduling rules (days, hours, duration, buffer)
- Ideal customer profile and qualification criteria
- Disqualification criteria
- Tool workflow instructions (calendar booking steps, email sending, etc.)
- Booking, escalation, and notification behavior

Do NOT restate ANY of these in your system_prompt. Your output is COMBINED with these directives, so repeating them wastes tokens and can cause conflicts. Focus your system_prompt entirely on business-specific knowledge, conversation approach, and role definition that the directives DON'T cover.

OTHER RULES:
- Do NOT reference specific tools or tool names in the system_prompt.
- The name should feel branded and specific, not generic like "AI Assistant" or "Chatbot".
- The greeting_message should be natural and inviting, not corporate or stiff.
- If the user mentions a specific business or niche, tailor everything to that context.`;

export function buildAgentGenerationContext(input: {
  userPrompt: string;
  templateContext?: {
    name: string;
    default_system_prompt_hint: string;
    suggested_personality: {
      tone: string;
      greeting_message: string;
    };
  } | null;
  businessContext?: {
    niche: string;
    segment: string;
    offer_description: string;
  } | null;
  wizardConfig?: {
    templateId: string;
    businessDescription?: string;
    agentName?: string;
    agentDescription?: string;
    behaviorConfig: Record<string, unknown>;
    personality: { tone: string; greeting_message: string };
    qualifyingQuestions?: string[];
    faqs?: Array<{ question: string; answer: string }>;
    scrapedPages?: Array<{ url: string; title: string; content: string }>;
    /** Pre-extracted business facts from website content (Haiku pass). */
    websiteSummary?: string;
  } | null;
}): string {
  const parts: string[] = [];

  // Wizard config produces a rich structured prompt
  if (input.wizardConfig) {
    const wc = input.wizardConfig;

    // Agent name/description preferences
    if (wc.agentName) {
      parts.push(
        `AGENT NAME (use this exact name): ${wc.agentName}${wc.agentDescription ? `\nAgent description: ${wc.agentDescription}` : ""}`,
      );
    }

    if (wc.businessDescription) {
      parts.push(`BUSINESS CONTEXT:\n${wc.businessDescription}`);
    }

    // Pass only the template type and high-level behavioral mode.
    // Specific config values (lead fields, scheduling, ICP, disqualification,
    // tool workflows, etc.) are handled by Configuration Directives and must
    // NOT be passed here to avoid duplication in the final prompt.
    if (wc.templateId === "appointment-booker") {
      const bc = wc.behaviorConfig as {
        booking_behavior?: string;
        qualification_mode?: string;
      };
      const lines = [
        "AGENT TYPE: Appointment Booker",
        `Qualification approach: ${bc.qualification_mode === "questions" ? "Ask specific qualifying questions (provided in Configuration Directives)" : "Have natural, conversational interactions to qualify visitors"}`,
        `After qualifying: ${bc.booking_behavior === "book_directly" ? "Book consultation appointments directly on the calendar" : "Collect visitor's contact details so the team can follow up manually"}`,
        "Note: Lead fields, scheduling rules, ICP criteria, service types, and tool workflows are provided in Configuration Directives — do not repeat them.",
      ];
      parts.push(lines.join("\n"));
    } else if (wc.templateId === "customer-support") {
      const sc = wc.behaviorConfig as {
        escalation_mode?: string;
      };
      const lines = [
        "AGENT TYPE: Customer Support",
        `Escalation approach: ${sc.escalation_mode === "always_available" ? "Handle all issues without escalating to a human" : "Escalate complex issues that cannot be resolved"}`,
        "Note: Escalation rules, response style, business hours, triage questions, and tool workflows are provided in Configuration Directives — do not repeat them.",
      ];
      parts.push(lines.join("\n"));
    } else if (wc.templateId === "lead-capture" || wc.templateId === "lead-qualification") {
      const lc = wc.behaviorConfig as {
        qualification_mode?: string;
        notification_behavior?: string;
      };
      const lines = [
        "AGENT TYPE: Lead Capture",
        `Qualification approach: ${lc.qualification_mode === "questions" ? "Ask specific qualifying questions (provided in Configuration Directives)" : "Have natural, conversational interactions to qualify visitors"}`,
        `After capturing: ${lc.notification_behavior === "email_team" ? "Send an internal notification to the team" : "Save lead data to the spreadsheet"}`,
        "Note: Lead fields, ICP criteria, notification rules, and tool workflows are provided in Configuration Directives — do not repeat them.",
      ];
      parts.push(lines.join("\n"));
    }

    // FAQs — include in system prompt context
    const faqs = wc.faqs ?? [];
    if (faqs.length > 0) {
      const faqText = faqs
        .map((f, i) => `  ${i + 1}. Q: ${f.question}\n     A: ${f.answer}`)
        .join("\n");
      parts.push(
        `KNOWLEDGE BASE FAQS (embed these in the system prompt so the agent can answer them):\n${faqText}`,
      );
    }

    // Website facts — pre-extracted by Haiku for cost efficiency
    if (wc.websiteSummary) {
      parts.push(
        `BUSINESS FACTS FROM WEBSITE (use these to write a tailored, specific system prompt — reference actual services, policies, and terminology):\n${wc.websiteSummary}`,
      );
    } else if (wc.scrapedPages?.length) {
      // Fallback: raw truncated content (if Haiku extraction was skipped/failed)
      const summary = wc.scrapedPages
        .map((p) => `- ${p.title} (${p.url}): ${p.content.slice(0, 500)}...`)
        .join("\n");
      parts.push(
        `WEBSITE CONTENT SUMMARY (use this to inform the agent's knowledge):\n${summary}`,
      );
    }

    parts.push(
      `PERSONALITY PREFERENCES (use these closely, only polish slightly):\nTone: ${wc.personality.tone}\nGreeting message: ${wc.personality.greeting_message}`,
    );

    return parts.join("\n\n---\n\n");
  }

  // Existing prompt-based flow
  if (input.userPrompt) {
    parts.push(`USER REQUEST:\n${input.userPrompt}`);
  }

  if (input.templateContext) {
    const t = input.templateContext;
    parts.push(
      `TEMPLATE STARTING POINT (use as a base, customize based on user request):\n` +
        `Template: ${t.name}\n` +
        `Hint: ${t.default_system_prompt_hint}\n` +
        `Suggested tone: ${t.suggested_personality.tone}\n` +
        `Suggested greeting: ${t.suggested_personality.greeting_message}`,
    );
  }

  if (input.businessContext) {
    const b = input.businessContext;
    parts.push(
      `BUSINESS CONTEXT (tailor the agent to this business):\n` +
        `Niche: ${b.niche}\n` +
        `Target segment: ${b.segment}\n` +
        `Service description: ${b.offer_description}`,
    );
  }

  return parts.join("\n\n---\n\n");
}
