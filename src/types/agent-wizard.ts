// ---------------------------------------------------------------------------
// Knowledge base types (used during wizard, before agent exists)
// ---------------------------------------------------------------------------

export interface DiscoveredPage {
  url: string;
  title: string;
  selected: boolean;
  status: "pending" | "scraping" | "done" | "error" | "empty";
  content?: string;
}

export interface WizardFaq {
  id: string;
  question: string;
  answer: string;
  source: "manual" | "generated";
}

export interface WizardFile {
  file: File;
  name: string;
  size: number;
  extractedText?: string;
}

// ---------------------------------------------------------------------------
// Template-specific behavior configs
// ---------------------------------------------------------------------------

export interface AppointmentBookerConfig {
  lead_fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
    custom_fields: string[];
  };
  booking_behavior: "book_directly" | "collect_and_follow_up";
  availability: {
    timezone: string;
    working_days: string[];
    start_time: string;
    end_time: string;
    appointment_duration: number;
    buffer_minutes: number;
    max_advance_days: number;
  };
  service_types: string[];
  cancellation_policy: string;
  /** "describe" = AI qualifies from ICP description; "questions" = user sets explicit questions */
  qualification_mode: "describe" | "questions";
  disqualification_criteria: string[];
  icp_description: string;
}

export interface CustomerSupportConfig {
  escalation_mode: "always_available" | "escalate_complex";
  response_style: "concise" | "detailed";
  escalation_contact: string;
  business_hours: string;
  after_hours_message: string;
  forbidden_topics: string[];
}

export interface LeadCaptureConfig {
  lead_fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
    custom_fields: string[];
  };
  notification_behavior: "email_team" | "sheet_only";
  notification_email: string;
  /** "describe" = AI qualifies from ICP description; "questions" = user sets explicit questions */
  qualification_mode: "describe" | "questions";
  disqualification_criteria: string[];
  icp_description: string;
}

/** @deprecated Use LeadCaptureConfig — kept for backward compat */
export type LeadQualificationConfig = LeadCaptureConfig;

// ---------------------------------------------------------------------------
// Wizard state (accumulated across all steps)
// ---------------------------------------------------------------------------

export interface AgentWizardState {
  // Step: Choose Type
  templateId: "appointment-booker" | "customer-support" | "lead-capture" | "lead-qualification" | null;

  // Step: Agent Name
  agentName: string;
  agentDescription: string;

  // Step: Business Context
  businessDescription: string;

  // Step: Website & Files
  websiteUrl: string;
  discoveredPages: DiscoveredPage[];
  files: WizardFile[];

  // Step: Knowledge (FAQs)
  faqs: WizardFaq[];

  // Step: Agent Personality
  tone: string;
  greetingMessage: string;

  // Template-specific behavior
  qualifyingQuestions: string[];
  appointmentBookerConfig: AppointmentBookerConfig;
  customerSupportConfig: CustomerSupportConfig;
  leadCaptureConfig: LeadCaptureConfig;

  // Integrations
  selectedToolkits: string[];
}

// ---------------------------------------------------------------------------
// Step definitions — dynamic per template
// ---------------------------------------------------------------------------

export type WizardStepId =
  | "choose-type"
  | "agent-name"
  | "business-context"
  | "website"
  | "knowledge"
  | "agent-personality"
  | "lead-qualification"
  | "lead-fields"
  | "scheduling"
  | "response-behavior"
  | "escalation"
  | "lead-collection"
  | "integrations"
  | "review";

export interface WizardStepDef {
  id: WizardStepId;
  label: string;
}

/** Returns the step sequence for a given template (or null = no template yet). */
export function getWizardSteps(templateId: string | null): WizardStepDef[] {
  // Core flow: focused, one-thing-per-screen, website early
  const core: WizardStepDef[] = [
    { id: "choose-type", label: "Agent Type" },
    { id: "agent-name", label: "Name" },
    { id: "business-context", label: "Your Business" },
    { id: "website", label: "Website" },
    { id: "knowledge", label: "Knowledge" },
    { id: "agent-personality", label: "Personality" },
  ];

  const review: WizardStepDef = { id: "review", label: "Review" };

  switch (templateId) {
    case "appointment-booker":
      return [
        ...core,
        { id: "lead-qualification", label: "Qualification" },
        { id: "lead-fields", label: "Lead Fields" },
        { id: "scheduling", label: "Scheduling" },
        { id: "integrations", label: "Integrations" },
        review,
      ];

    case "customer-support":
      return [
        ...core,
        { id: "response-behavior", label: "Response Style" },
        { id: "escalation", label: "Escalation" },
        { id: "integrations", label: "Integrations" },
        review,
      ];

    case "lead-capture":
    case "lead-qualification":
      return [
        ...core,
        { id: "lead-qualification", label: "Qualification" },
        { id: "lead-collection", label: "Lead Collection" },
        { id: "integrations", label: "Integrations" },
        review,
      ];

    default:
      // No template selected yet — show only step 1
      return [{ id: "choose-type", label: "Agent Type" }, review];
  }
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

export function createInitialWizardState(): AgentWizardState {
  return {
    templateId: null,
    agentName: "",
    agentDescription: "",
    businessDescription: "",
    websiteUrl: "",
    discoveredPages: [],
    files: [],
    faqs: [],
    tone: "",
    greetingMessage: "",
    qualifyingQuestions: [],
    appointmentBookerConfig: {
      lead_fields: { name: true, email: true, phone: true, company: false, custom_fields: [] },
      booking_behavior: "book_directly",
      availability: {
        timezone: "",
        working_days: ["mon", "tue", "wed", "thu", "fri"],
        start_time: "09:00",
        end_time: "17:00",
        appointment_duration: 30,
        buffer_minutes: 15,
        max_advance_days: 30,
      },
      service_types: [],
      cancellation_policy: "",
      qualification_mode: "describe",
      disqualification_criteria: [],
      icp_description: "",
    },
    customerSupportConfig: {
      escalation_mode: "escalate_complex",
      response_style: "detailed",
      escalation_contact: "",
      business_hours: "",
      after_hours_message: "",
      forbidden_topics: [],
    },
    leadCaptureConfig: {
      lead_fields: { name: true, email: true, phone: true, company: true, custom_fields: [] },
      notification_behavior: "email_team",
      notification_email: "",
      qualification_mode: "describe",
      icp_description: "",
      disqualification_criteria: [],
    },
    selectedToolkits: [],
  };
}

// ---------------------------------------------------------------------------
// Generation payload (sent to API)
// ---------------------------------------------------------------------------

export interface WizardGenerationPayload {
  templateId: string;
  systemId?: string;
  businessDescription?: string;
  agentName: string;
  agentDescription: string;
  behaviorConfig: AppointmentBookerConfig | CustomerSupportConfig | LeadCaptureConfig | Record<string, unknown>;
  personality: {
    tone: string;
    greeting_message: string;
  };
  qualifyingQuestions: string[];
  faqs: Array<{ question: string; answer: string }>;
  scrapedPages: Array<{ url: string; title: string; content: string }>;
  files: Array<{ name: string; extractedText: string }>;
  selectedToolkits?: string[];
}
