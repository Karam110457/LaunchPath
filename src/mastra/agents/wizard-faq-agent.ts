import { Agent } from "@mastra/core/agent";
import { WIZARD_FAQ_GENERATOR_PROMPT } from "@/lib/ai/wizard-prompts";

export const wizardFaqAgent = new Agent({
  id: "wizard-faq-generator",
  name: "Wizard FAQ Generator",
  instructions: WIZARD_FAQ_GENERATOR_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
});
