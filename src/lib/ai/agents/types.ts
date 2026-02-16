/**
 * Shared types for niche-specific demo page agents.
 */

export interface FormField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required: boolean;
}

export interface AgentConfig {
  id: string;
  niche: string;
  name: string;
  description: string;
  systemPrompt: string;
  formFields: FormField[];
}

export type { DemoResult } from "@/lib/ai/schemas";
