/**
 * Code-oriented builder tools for the coding agent.
 * Replaces the config-patch tools with 3 code manipulation tools.
 */

import { tool } from "ai";
import { z } from "zod";

export type BuilderCodeEvent =
  | { type: "text-delta"; delta: string }
  | { type: "text-done" }
  | { type: "code-update"; code: string }
  | { type: "done" }
  | { type: "error"; message: string };

type EmitFn = (event: BuilderCodeEvent) => void;

const REQUIRED_MARKERS = ["DemoPage", "InteractiveDemo"] as const;

function validateCode(code: string): string | null {
  if (!code || typeof code !== "string") {
    return "Code must be a non-empty string.";
  }
  for (const marker of REQUIRED_MARKERS) {
    if (!code.includes(marker)) {
      return `Code must contain "${marker}". This is a required element.`;
    }
  }
  if (!code.includes("function DemoPage")) {
    return 'Code must define a "function DemoPage()" component.';
  }
  return null;
}

export function createBuilderCodeTools(
  emit: EmitFn,
  getCurrentCode: () => string
) {
  const get_current_code = tool({
    description:
      "Read the current page code. Use this before making edits to understand the current state.",
    inputSchema: z.object({}),
    execute: async () => {
      return { code: getCurrentCode() };
    },
  });

  const write_page_code = tool({
    description:
      "Replace the entire page code. Use for major restructuring, adding new sections, or when many changes are needed at once. The code must define a function DemoPage() component and include <InteractiveDemo /> and <DemoFooter />.",
    inputSchema: z.object({
      code: z
        .string()
        .describe(
          "The complete JSX+Tailwind code for the page. Must define function DemoPage() and include <InteractiveDemo />."
        ),
    }),
    execute: async ({ code }) => {
      const error = validateCode(code);
      if (error) {
        return { error };
      }
      emit({ type: "code-update", code });
      return { success: true };
    },
  });

  const edit_page_code = tool({
    description:
      "Find and replace a specific section of the page code. Use for small, targeted edits like changing text, updating a class, or tweaking a section. More precise than write_page_code.",
    inputSchema: z.object({
      find: z
        .string()
        .describe("The exact string to find in the current code."),
      replace: z
        .string()
        .describe("The string to replace it with."),
    }),
    execute: async ({ find, replace }) => {
      const current = getCurrentCode();

      if (!current.includes(find)) {
        return {
          error: `Could not find the specified string in the current code. Make sure you're using the exact text. Use get_current_code to see the latest code.`,
        };
      }

      const newCode = current.replace(find, replace);
      const error = validateCode(newCode);
      if (error) {
        return { error: `Edit would break the page: ${error}` };
      }

      emit({ type: "code-update", code: newCode });
      return { success: true };
    },
  });

  return {
    get_current_code,
    write_page_code,
    edit_page_code,
  };
}
