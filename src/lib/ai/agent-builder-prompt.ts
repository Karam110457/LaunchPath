/**
 * Agent builder system prompt + context builder.
 * Used by the agent-builder Mastra agent to generate agent configs from user prompts.
 */

export const AGENT_BUILDER_SYSTEM_PROMPT = `You are LaunchPath's Agent Builder AI. Your job is to generate a complete AI agent configuration based on the user's description.

You will receive a description of what kind of agent the user wants. You must generate:

1. **name** — A short, professional agent name (2-4 words). Examples: "Apex Roofing Assistant", "Solar Lead Qualifier", "Booking Bot". Make it specific to the use case, not generic.

2. **description** — A single sentence describing what this agent does. Be specific and action-oriented.

3. **system_prompt** — A detailed, production-ready system prompt that will instruct the runtime AI agent. This should be 200-400 words and include:
   - The agent's role and personality
   - Specific behaviors and conversation flow
   - What information to collect from the user
   - Tone guidelines
   - What NOT to do (boundaries)
   The system prompt should be written as direct instructions to the agent (second person: "You are...", "You should...").
   Do NOT include tool workflow instructions or tool usage steps — those are appended separately after your output.

4. **personality** — An object with:
   - tone: A short phrase describing communication style (e.g. "friendly and efficient", "warm and professional")
   - greeting_message: The first message the agent sends when a conversation starts (1-2 sentences)

IMPORTANT RULES:
- The system_prompt must be self-contained — it should work as standalone instructions for an AI agent without any other context.
- Do NOT reference specific tools or tool names in the system_prompt. Describe capabilities in general terms (e.g. "collect their contact information" instead of "use the lead-capture tool").
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

    // Qualifying questions (now top-level, shared across templates)
    const questions = (wc.qualifyingQuestions ?? []).filter((q) => q.trim());

    if (wc.templateId === "appointment-booker") {
      const bc = wc.behaviorConfig as {
        lead_fields?: { phone?: boolean; company?: boolean; custom_fields?: string[] };
        booking_behavior?: string;
        availability?: {
          timezone?: string; working_days?: string[]; start_time?: string;
          end_time?: string; appointment_duration?: number; buffer_minutes?: number;
          max_advance_days?: number;
        };
        service_types?: string[];
        cancellation_policy?: string;
        qualification_mode?: string;
        icp_description?: string;
        disqualification_criteria?: string[];
      };

      const lines = ["AGENT TYPE: Appointment Booker"];

      if (bc.qualification_mode === "questions" && questions.length > 0) {
        lines.push(
          `Qualifying questions to ask leads (ask these exact questions):\n${questions.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}`,
        );
      } else if (bc.icp_description) {
        lines.push(
          `Ideal customer profile: ${bc.icp_description}\nThe agent should ask natural, conversational questions to determine if the visitor matches this profile.`,
        );
      }

      const fields = ["name (always)", "email (always)"];
      if (bc.lead_fields?.phone) fields.push("phone");
      if (bc.lead_fields?.company) fields.push("company");
      const custom = (bc.lead_fields?.custom_fields ?? []).filter((f) =>
        f.trim(),
      );
      fields.push(...custom);
      lines.push(`Lead fields to capture: ${fields.join(", ")}`);
      lines.push(
        `Booking behavior: ${bc.booking_behavior === "book_directly" ? "Book appointments directly on calendar" : "Collect lead information for manual follow-up"}`,
      );

      if (bc.availability?.working_days?.length) {
        const a = bc.availability;
        const days = a.working_days ?? [];
        lines.push(
          `Availability: ${days.join(", ")} ${a.start_time}–${a.end_time}${a.timezone ? ` (${a.timezone})` : ""}`,
        );
        lines.push(
          `Appointment duration: ${a.appointment_duration ?? 30} min, buffer: ${a.buffer_minutes ?? 0} min, max advance: ${a.max_advance_days ?? 30} days`,
        );
      }
      if (bc.service_types?.length) {
        lines.push(`Service types: ${bc.service_types.join(", ")}`);
      }
      if (bc.cancellation_policy) {
        lines.push(`Cancellation policy: ${bc.cancellation_policy}`);
      }
      if (bc.disqualification_criteria?.length) {
        lines.push(`Disqualification criteria: ${bc.disqualification_criteria.join("; ")}`);
      }

      parts.push(lines.join("\n"));
    } else if (wc.templateId === "customer-support") {
      const sc = wc.behaviorConfig as {
        escalation_mode?: string;
        response_style?: string;
        escalation_contact?: string;
        business_hours?: string;
        after_hours_message?: string;
        forbidden_topics?: string[];
      };

      const lines = ["AGENT TYPE: Customer Support"];

      if (questions.length > 0) {
        lines.push(
          `Qualifying questions to ask visitors:\n${questions.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}`,
        );
      }

      lines.push(
        `Escalation: ${sc.escalation_mode === "always_available" ? "Handle everything, never escalate" : "Escalate complex issues by sending an email to the team via Gmail"}`,
      );
      if (sc.escalation_contact) {
        lines.push(`Escalation email (send escalation emails here via Gmail): ${sc.escalation_contact}`);
      }
      lines.push(
        `Response style: ${sc.response_style === "concise" ? "Keep answers short and direct" : "Provide detailed, thorough explanations"}`,
      );
      if (sc.business_hours) {
        lines.push(`Business hours: ${sc.business_hours}`);
        if (sc.after_hours_message) {
          lines.push(`After-hours message: ${sc.after_hours_message}`);
        }
      }
      if (sc.forbidden_topics?.length) {
        lines.push(`Forbidden topics (agent must never discuss): ${sc.forbidden_topics.join(", ")}`);
      }

      parts.push(lines.join("\n"));
    } else if (wc.templateId === "lead-capture" || wc.templateId === "lead-qualification") {
      const lc = wc.behaviorConfig as {
        lead_fields?: {
          phone?: boolean; company?: boolean; custom_fields?: string[];
        };
        notification_behavior?: string;
        notification_email?: string;
        qualification_mode?: string;
        icp_description?: string;
        disqualification_criteria?: string[];
      };

      const lines = ["AGENT TYPE: Lead Capture"];

      if (lc.qualification_mode === "questions" && questions.length > 0) {
        lines.push(
          `Qualifying questions to ask leads (ask these exact questions):\n${questions.map((q, i) => `  ${i + 1}. ${q}`).join("\n")}`,
        );
      } else if (lc.icp_description) {
        lines.push(
          `Ideal customer profile: ${lc.icp_description}\nThe agent should ask natural, conversational questions to determine if the visitor matches this profile.`,
        );
      }

      const fields = ["name (always)", "email (always)"];
      if (lc.lead_fields?.phone) fields.push("phone");
      if (lc.lead_fields?.company) fields.push("company");
      const customFields = (lc.lead_fields?.custom_fields ?? []).filter(
        (f) => f.trim(),
      );
      fields.push(...customFields);
      lines.push(`Lead fields to capture: ${fields.join(", ")}`);

      lines.push(
        `Notification: ${lc.notification_behavior === "email_team" ? "Email team with lead summary when captured" : "Save leads to spreadsheet only"}`,
      );
      if (lc.notification_email && lc.notification_behavior === "email_team") {
        lines.push(`Notification email: ${lc.notification_email}`);
      }
      if (lc.disqualification_criteria?.length) {
        lines.push(`Disqualification criteria: ${lc.disqualification_criteria.join("; ")}`);
      }

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
