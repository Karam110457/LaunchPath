/**
 * Builder tool factory for the demo page builder assistant.
 * Tools emit config-patch events via the SSE writer closure.
 */

import { tool } from "ai";
import { z } from "zod";
import type { DemoConfig, DemoTheme, FormField } from "@/lib/ai/schemas";

export type BuilderEvent =
  | { type: "text-delta"; delta: string }
  | { type: "text-done" }
  | { type: "config-patch"; patch: Partial<DemoConfig> }
  | { type: "done" }
  | { type: "error"; message: string };

type EmitFn = (event: BuilderEvent) => void;

export function createBuilderTools(
  emit: EmitFn,
  getCurrentConfig: () => DemoConfig
) {
  const update_hero = tool({
    description:
      "Update the hero section copy: headline, subheadline, and/or transformation text.",
    inputSchema: z.object({
      hero_headline: z.string().optional().describe("New headline (max 12 words)"),
      hero_subheadline: z.string().optional().describe("New subheadline"),
      transformation_headline: z
        .string()
        .optional()
        .describe("New transformation text (From X to Y)"),
    }),
    execute: async (params) => {
      const patch: Partial<DemoConfig> = {};
      if (params.hero_headline) patch.hero_headline = params.hero_headline;
      if (params.hero_subheadline)
        patch.hero_subheadline = params.hero_subheadline;
      if (params.transformation_headline)
        patch.transformation_headline = params.transformation_headline;

      emit({ type: "config-patch", patch });
      return { updated: Object.keys(patch) };
    },
  });

  const update_cta = tool({
    description: "Update the call-to-action button text.",
    inputSchema: z.object({
      cta_button_text: z.string().describe("New CTA button text"),
    }),
    execute: async ({ cta_button_text }) => {
      emit({
        type: "config-patch",
        patch: { cta_button_text },
      });
      return { updated: ["cta_button_text"] };
    },
  });

  const update_agent_info = tool({
    description: "Update the agent name or description shown on the page.",
    inputSchema: z.object({
      agent_name: z.string().optional().describe("New agent name"),
      agent_description: z
        .string()
        .optional()
        .describe("New agent description"),
    }),
    execute: async (params) => {
      const patch: Partial<DemoConfig> = {};
      if (params.agent_name) patch.agent_name = params.agent_name;
      if (params.agent_description)
        patch.agent_description = params.agent_description;

      emit({ type: "config-patch", patch });
      return { updated: Object.keys(patch) };
    },
  });

  const toggle_section = tool({
    description:
      "Show or hide the guarantee or pricing section. Optionally update the display text.",
    inputSchema: z.object({
      section: z.enum(["guarantee", "pricing"]).describe("Which section"),
      visible: z.boolean().describe("Whether to show the section"),
      text: z
        .string()
        .optional()
        .describe("Updated display text for the section"),
    }),
    execute: async ({ section, visible, text }) => {
      const patch: Partial<DemoConfig> = {};
      if (section === "guarantee") {
        patch.show_guarantee = visible;
        if (text !== undefined) patch.guarantee_text = text;
      } else {
        patch.show_pricing = visible;
        if (text !== undefined) patch.pricing_text = text;
      }

      emit({ type: "config-patch", patch });
      return { updated: Object.keys(patch) };
    },
  });

  const add_form_field = tool({
    description:
      "Add a new form field. The page should have 3-5 fields total.",
    inputSchema: z.object({
      name: z.string().describe("Field name in snake_case"),
      label: z.string().describe("User-facing label"),
      type: z
        .enum(["text", "number", "select", "textarea"])
        .describe("Input type"),
      placeholder: z.string().describe("Placeholder text"),
      required: z.boolean().describe("Whether the field is required"),
      options: z
        .array(z.string())
        .optional()
        .describe("Options for select fields"),
      helpText: z.string().optional().describe("Helper text below the field"),
    }),
    execute: async (params) => {
      const config = getCurrentConfig();
      const newField: FormField = {
        name: params.name,
        label: params.label,
        type: params.type,
        placeholder: params.placeholder,
        required: params.required,
        options: params.options,
        helpText: params.helpText,
      };

      const updatedFields = [...config.form_fields, newField];
      emit({
        type: "config-patch",
        patch: { form_fields: updatedFields },
      });
      return { added: params.name, totalFields: updatedFields.length };
    },
  });

  const remove_form_field = tool({
    description: "Remove a form field by its name.",
    inputSchema: z.object({
      name: z.string().describe("The name of the field to remove"),
    }),
    execute: async ({ name }) => {
      const config = getCurrentConfig();
      const updatedFields = config.form_fields.filter(
        (f) => f.name !== name
      );

      if (updatedFields.length === config.form_fields.length) {
        return { error: `Field "${name}" not found` };
      }

      emit({
        type: "config-patch",
        patch: { form_fields: updatedFields },
      });
      return { removed: name, totalFields: updatedFields.length };
    },
  });

  const update_form_field = tool({
    description: "Update an existing form field's properties.",
    inputSchema: z.object({
      name: z.string().describe("The name of the field to update"),
      label: z.string().optional().describe("New label"),
      type: z
        .enum(["text", "number", "select", "textarea"])
        .optional()
        .describe("New input type"),
      placeholder: z.string().optional().describe("New placeholder"),
      required: z.boolean().optional().describe("New required status"),
      options: z
        .array(z.string())
        .optional()
        .describe("New options (for select)"),
      helpText: z.string().optional().describe("New help text"),
    }),
    execute: async ({ name, ...updates }) => {
      const config = getCurrentConfig();
      const fieldIndex = config.form_fields.findIndex(
        (f) => f.name === name
      );

      if (fieldIndex === -1) {
        return { error: `Field "${name}" not found` };
      }

      const updatedFields = [...config.form_fields];
      updatedFields[fieldIndex] = {
        ...updatedFields[fieldIndex],
        ...Object.fromEntries(
          Object.entries(updates).filter(([, v]) => v !== undefined)
        ),
      };

      emit({
        type: "config-patch",
        patch: { form_fields: updatedFields },
      });
      return { updated: name };
    },
  });

  const update_theme = tool({
    description:
      "Update the page's visual theme: accent color, CTA button color, and/or headline style.",
    inputSchema: z.object({
      accent_color: z
        .enum(["emerald", "blue", "violet", "amber", "rose", "cyan"])
        .optional()
        .describe("Page accent color (badges, icons, trust block)"),
      cta_color: z
        .enum(["orange", "emerald", "blue", "rose", "amber"])
        .optional()
        .describe("CTA button color — warm colors (orange, amber, rose) convert best"),
      headline_style: z
        .enum(["serif-italic", "sans-bold"])
        .optional()
        .describe("Headline typography: serif-italic (premium) or sans-bold (direct)"),
    }),
    execute: async (params) => {
      const config = getCurrentConfig();
      const currentTheme: DemoTheme = config.theme ?? {
        accent_color: "emerald",
        cta_color: "orange",
        headline_style: "serif-italic",
      };

      const newTheme: DemoTheme = {
        ...currentTheme,
        ...Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined)
        ),
      };

      emit({ type: "config-patch", patch: { theme: newTheme } });
      return {
        updated: Object.keys(params).filter(
          (k) => params[k as keyof typeof params] !== undefined
        ),
      };
    },
  });

  return {
    update_hero,
    update_cta,
    update_agent_info,
    toggle_section,
    add_form_field,
    remove_form_field,
    update_form_field,
    update_theme,
  };
}
