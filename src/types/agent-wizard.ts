// ---------------------------------------------------------------------------
// Template-specific behavior configs
// ---------------------------------------------------------------------------

export interface AppointmentBookerConfig {
  services: string;
  qualifying_questions: string[];
  lead_fields: {
    phone: boolean;
    company: boolean;
    custom_fields: string[];
  };
  booking_behavior: "book_directly" | "collect_and_follow_up";
}

export interface CustomerSupportConfig {
  business_description: string;
  support_topics: string[];
  escalation_mode: "always_available" | "escalate_complex";
  response_style: "concise" | "detailed";
}

// ---------------------------------------------------------------------------
// Wizard state (accumulated across all steps)
// ---------------------------------------------------------------------------

export interface AgentWizardState {
  // Step 1
  templateId: "appointment-booker" | "customer-support" | null;

  // Step 2
  businessContextMode: "link_system" | "describe" | null;
  linkedSystemId: string | null;
  businessDescription: string;

  // Step 3 (only one used, based on templateId)
  appointmentBookerConfig: AppointmentBookerConfig;
  customerSupportConfig: CustomerSupportConfig;

  // Step 4
  tone: string;
  greetingMessage: string;
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

export interface WizardStepDef {
  id:
    | "choose-type"
    | "business-context"
    | "behavior"
    | "personality"
    | "review";
  label: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  { id: "choose-type", label: "Agent Type" },
  { id: "business-context", label: "Your Business" },
  { id: "behavior", label: "Behavior" },
  { id: "personality", label: "Personality" },
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
    appointmentBookerConfig: {
      services: "",
      qualifying_questions: [""],
      lead_fields: { phone: true, company: false, custom_fields: [] },
      booking_behavior: "collect_and_follow_up",
    },
    customerSupportConfig: {
      business_description: "",
      support_topics: [""],
      escalation_mode: "escalate_complex",
      response_style: "detailed",
    },
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
  behaviorConfig: AppointmentBookerConfig | CustomerSupportConfig;
  personality: {
    tone: string;
    greeting_message: string;
  };
}
