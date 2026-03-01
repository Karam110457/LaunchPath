import { Agent } from "@mastra/core/agent";
import { WIZARD_QUESTION_GENERATOR_PROMPT } from "@/lib/ai/wizard-prompts";

export const wizardQuestionAgent = new Agent({
  id: "wizard-question-generator",
  name: "Wizard Question Generator",
  instructions: WIZARD_QUESTION_GENERATOR_PROMPT,
  model: "anthropic/claude-sonnet-4-5-20250929",
});
