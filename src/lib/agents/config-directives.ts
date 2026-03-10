/**
 * config-directives.ts — Generates Configuration Directives text from
 * structured wizard config and personality settings, and manages the
 * directives section within the system prompt.
 *
 * Directives are written INTO system_prompt so users can see and edit them
 * on the Advanced (Prompt) tab. This replaces the old runtime injection.
 */

// ---------------------------------------------------------------------------
// Section markers (visible in prompt textarea, clearly machine-parseable)
// ---------------------------------------------------------------------------

const SECTION_START = "<!-- BEGIN CONFIGURATION -->";
const SECTION_END = "<!-- END CONFIGURATION -->";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DirectivesInput {
  personality?: {
    tone?: string;
    greeting_message?: string;
    language?: string;
  } | null;
  wizardConfig?: {
    templateId?: string;
    qualifyingQuestions?: string[];
    behaviorConfig?: Record<string, unknown>;
  } | null;
  /** Tool workflow instructions from template (stored in ai_agents.tool_guidelines). */
  toolGuidelines?: string;
}

// ---------------------------------------------------------------------------
// Generate directives text from structured config
// ---------------------------------------------------------------------------

export function generateConfigDirectives(input: DirectivesInput): string {
  const directives: string[] = [];

  // ── Personality ──────────────────────────────────────────────────────
  if (input.personality?.tone) {
    directives.push(
      `Communication style: Maintain a ${input.personality.tone} tone throughout the conversation.`
    );
  }

  if (input.personality?.language && input.personality.language !== "en") {
    const langNames: Record<string, string> = {
      es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
      it: "Italian", nl: "Dutch", ar: "Arabic", zh: "Chinese (Simplified)",
      ja: "Japanese", ko: "Korean", ru: "Russian", hi: "Hindi",
      tr: "Turkish", pl: "Polish", sv: "Swedish", da: "Danish", he: "Hebrew",
    };
    const langName = langNames[input.personality.language] ?? input.personality.language;
    directives.push(
      `Language: Always respond in ${langName}. Regardless of what language the user writes in, all your responses must be in ${langName}.`
    );
  }

  // ── Qualifying Questions ─────────────────────────────────────────────
  if (input.wizardConfig?.qualifyingQuestions?.length) {
    const numbered = input.wizardConfig.qualifyingQuestions
      .filter((q) => q.trim())
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
    if (numbered) {
      directives.push(
        `Ask these qualifying questions during the conversation:\n${numbered}`
      );
    }
  }

  // ── Behavior Config ──────────────────────────────────────────────────
  if (input.wizardConfig?.behaviorConfig) {
    const bc = input.wizardConfig.behaviorConfig;

    if (bc.lead_fields) {
      const fields = bc.lead_fields as Record<string, unknown>;
      const active = [
        "name",
        "email",
        ...Object.entries(fields)
          .filter(([k, v]) => k !== "custom_fields" && v === true)
          .map(([k]) => k),
      ];
      const customFields = fields.custom_fields;
      if (Array.isArray(customFields)) {
        active.push(...customFields.filter((f: unknown) => typeof f === "string" && f.trim()));
      }
      directives.push(
        `Lead capture: Collect the following fields from the visitor: ${active.join(", ")}.`
      );
    }

    if (bc.booking_behavior === "book_directly") {
      directives.push(
        "After qualifying, book an appointment directly on the calendar."
      );
    } else if (bc.booking_behavior === "collect_and_follow_up") {
      directives.push(
        "After qualifying, collect the visitor's contact details so the team can follow up manually."
      );
    }

    if (bc.escalation_mode === "always_available") {
      directives.push(
        "Handle all issues yourself without escalating to a human agent."
      );
    } else if (bc.escalation_mode === "escalate_complex") {
      directives.push(
        "If you cannot resolve an issue, escalate to a human agent."
      );
    }

    if (bc.response_style === "concise") {
      directives.push(
        "Response style: Keep answers concise and direct. Get to the point quickly."
      );
    } else if (bc.response_style === "detailed") {
      directives.push(
        "Response style: Provide thorough, step-by-step explanations with context."
      );
    }

    if (bc.notification_behavior === "email_team") {
      directives.push(
        "When a lead is qualified, send an internal notification email to the team with the lead summary. Never email the lead directly."
      );
    } else if (bc.notification_behavior === "sheet_only") {
      directives.push(
        "Save qualified leads to the spreadsheet only. Do not send email notifications."
      );
    }

    // ── Appointment Booker: availability & scheduling ──────────────────
    const avail = bc.availability as {
      timezone?: string;
      working_days?: string[];
      start_time?: string;
      end_time?: string;
      appointment_duration?: number;
      buffer_minutes?: number;
      max_advance_days?: number;
    } | undefined;

    if (avail?.working_days?.length && avail.start_time && avail.end_time) {
      const dayMap: Record<string, string> = {
        mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
        fri: "Friday", sat: "Saturday", sun: "Sunday",
      };
      const dayNames = avail.working_days.map((d) => dayMap[d] ?? d).join(", ");
      const tz = avail.timezone ? ` (${avail.timezone})` : "";
      directives.push(
        `Scheduling: Only book appointments on ${dayNames}, ${avail.start_time}–${avail.end_time}${tz}. ` +
        `Each appointment is ${avail.appointment_duration ?? 30} minutes with ${avail.buffer_minutes ?? 0} minutes buffer. ` +
        `Allow booking up to ${avail.max_advance_days ?? 30} days in advance.`
      );
    }

    const serviceTypes = bc.service_types as string[] | undefined;
    if (serviceTypes?.length) {
      directives.push(
        `Appointment types: ${serviceTypes.join(", ")}. Ask which type the visitor needs.`
      );
    }

    const cancelPolicy = bc.cancellation_policy as string | undefined;
    if (cancelPolicy) {
      directives.push(
        `Cancellation policy: ${cancelPolicy}. Communicate this to the visitor after booking.`
      );
    }

    // ── Customer Support: escalation & hours ───────────────────────────
    const escalationContact = bc.escalation_contact as string | undefined;
    if (escalationContact) {
      directives.push(
        `When escalating, direct the customer to: ${escalationContact}`
      );
    }

    const businessHours = bc.business_hours as string | undefined;
    if (businessHours) {
      directives.push(`Business hours: ${businessHours}.`);
      const afterHoursMsg = bc.after_hours_message as string | undefined;
      if (afterHoursMsg) {
        directives.push(
          `Outside business hours, respond with: "${afterHoursMsg}"`
        );
      }
    }

    const forbiddenTopics = bc.forbidden_topics as string[] | undefined;
    if (forbiddenTopics?.length) {
      directives.push(
        `NEVER discuss: ${forbiddenTopics.join(", ")}. Politely redirect if asked.`
      );
    }

    // ── Lead Qualification: ICP & disqualification ─────────────────────
    const icpDesc = bc.icp_description as string | undefined;
    if (icpDesc) {
      directives.push(
        `Ideal customer profile: ${icpDesc}. Prioritize leads matching this profile.`
      );
    }

    const disqualCriteria = bc.disqualification_criteria as string[] | undefined;
    if (disqualCriteria?.length) {
      directives.push(
        `Disqualify leads matching: ${disqualCriteria.join("; ")}. Be polite but transparent about fit.`
      );
    }

    const notifEmail = bc.notification_email as string | undefined;
    if (notifEmail && bc.notification_behavior === "email_team") {
      directives.push(`Send lead notification emails to: ${notifEmail}`);
    }
  }

  // ── Tool Guidelines (from template) ──────────────────────────────────
  if (input.toolGuidelines?.trim()) {
    directives.push(input.toolGuidelines.trim());
  }

  if (directives.length === 0) return "";

  const lines = [
    SECTION_START,
    "## Configuration Directives",
    "These directives are generated from your agent settings. Edit them here or update via the Basics tab.",
    "",
    ...directives.map((d) => `- ${d}`),
    SECTION_END,
  ];

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Update directives section within a system prompt
// ---------------------------------------------------------------------------

/**
 * Replaces the config directives section in the given system prompt.
 * If no section exists, appends it. If newDirectives is empty, removes the section.
 */
export function updatePromptDirectives(
  currentPrompt: string,
  newDirectives: string,
): string {
  const startIdx = currentPrompt.indexOf(SECTION_START);
  const endIdx = currentPrompt.indexOf(SECTION_END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Found existing section — replace it
    const before = currentPrompt.slice(0, startIdx).replace(/\n+$/, "");
    const after = currentPrompt.slice(endIdx + SECTION_END.length).replace(/^\n+/, "");

    if (!newDirectives) {
      // Remove the section entirely
      return [before, after].filter(Boolean).join("\n\n");
    }
    return [before, newDirectives, after].filter(Boolean).join("\n\n");
  }

  // No existing section
  if (!newDirectives) return currentPrompt;

  // Append to the end
  return currentPrompt.trimEnd() + "\n\n" + newDirectives;
}

// ---------------------------------------------------------------------------
// Check if a prompt has a config directives section
// ---------------------------------------------------------------------------

export function hasConfigDirectivesSection(prompt: string): boolean {
  return prompt.includes(SECTION_START) && prompt.includes(SECTION_END);
}
