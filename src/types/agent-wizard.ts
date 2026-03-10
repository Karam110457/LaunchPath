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
// Template-specific behavior configs (kept for conversation flow step)
// ---------------------------------------------------------------------------

export interface AppointmentBookerConfig {
  lead_fields: {
    phone: boolean;
    company: boolean;
    custom_fields: string[];
  };
  booking_behavior: "book_directly" | "collect_and_follow_up";
}

export interface CustomerSupportConfig {
  escalation_mode: "always_available" | "escalate_complex";
  response_style: "concise" | "detailed";
}

export interface LeadQualificationConfig {
  lead_fields: {
    phone: boolean;
    company: boolean;
    budget: boolean;
    timeline: boolean;
    custom_fields: string[];
  };
  notification_behavior: "email_team" | "sheet_only";
}

// ---------------------------------------------------------------------------
// Wizard state (accumulated across all 6 steps)
// ---------------------------------------------------------------------------

export interface AgentWizardState {
  // Step 1: Agent Type
  templateId: "appointment-booker" | "customer-support" | "lead-qualification" | null;

  // Step 2: Your Business
  businessContextMode: "link_system" | "describe" | null;
  linkedSystemId: string | null;
  businessDescription: string;
  websiteUrl: string;
  discoveredPages: DiscoveredPage[];

  // Step 3: Knowledge Base
  faqs: WizardFaq[];
  files: WizardFile[];

  // Step 4: Conversation Flow
  qualifyingQuestions: string[];
  appointmentBookerConfig: AppointmentBookerConfig;
  customerSupportConfig: CustomerSupportConfig;
  leadQualificationConfig: LeadQualificationConfig;

  // Step 5: Integrations (tool preview)
  selectedToolkits: string[];

  // Step 6: Agent Identity
  agentName: string;
  agentDescription: string;
  tone: string;
  greetingMessage: string;
}

// ---------------------------------------------------------------------------
// Step definitions (6 steps)
// ---------------------------------------------------------------------------

export interface WizardStepDef {
  id:
    | "choose-type"
    | "business-context"
    | "knowledge-base"
    | "conversation-flow"
    | "integrations"
    | "agent-identity"
    | "review";
  label: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  { id: "choose-type", label: "Agent Type" },
  { id: "business-context", label: "Your Business" },
  { id: "knowledge-base", label: "Knowledge Base" },
  { id: "conversation-flow", label: "Conversation Flow" },
  { id: "integrations", label: "Integrations" },
  { id: "agent-identity", label: "Agent Identity" },
  { id: "review", label: "Review" },
];

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

export function createInitialWizardState(): AgentWizardState {
  return {
    templateId: null,
    businessContextMode: null,
    linkedSystemId: null,
    businessDescription: "",
    websiteUrl: "",
    discoveredPages: [],
    faqs: [],
    files: [],
    qualifyingQuestions: [],
    appointmentBookerConfig: {
      lead_fields: { phone: true, company: false, custom_fields: [] },
      booking_behavior: "collect_and_follow_up",
    },
    customerSupportConfig: {
      escalation_mode: "escalate_complex",
      response_style: "detailed",
    },
    leadQualificationConfig: {
      lead_fields: { phone: true, company: true, budget: false, timeline: false, custom_fields: [] },
      notification_behavior: "email_team",
    },
    selectedToolkits: [],
    agentName: "",
    agentDescription: "",
    tone: "",
    greetingMessage: "",
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
  behaviorConfig: AppointmentBookerConfig | CustomerSupportConfig | LeadQualificationConfig;
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
