/**
 * Dynamic JSX renderer using sucrase for transpilation.
 * Converts agent-generated JSX+Tailwind code → React elements at runtime.
 *
 * Convention: agent code defines `function DemoPage() { return (...) }`.
 * The renderer transpiles, evaluates, and instantiates it with injected scope.
 */

import { transform } from "sucrase";
import React from "react";

interface RenderResult {
  element: React.ReactElement | null;
  error: string | null;
}

/**
 * Transpile and evaluate JSX code, returning a React element.
 *
 * @param code - JSX source code defining a `DemoPage` function component
 * @param scope - Object of named values available to the code (components, utils, etc.)
 */
export function renderJSX(
  code: string,
  scope: Record<string, unknown>
): RenderResult {
  // 1. Transpile JSX → createElement calls
  let transpiledCode: string;
  try {
    const result = transform(code, {
      transforms: ["jsx"],
      jsxRuntime: "classic",
      production: true,
    });
    transpiledCode = result.code;
  } catch (err) {
    return {
      element: null,
      error: `Transpilation error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 2. Wrap code to return the DemoPage component
  const wrappedCode = `
    ${transpiledCode}
    if (typeof DemoPage !== 'function') {
      throw new Error('Code must define a function DemoPage() component');
    }
    return DemoPage;
  `;

  // 3. Build function with scope injection
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((k) => scope[k]);

  let DemoPageComponent: React.ComponentType;
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function("React", ...scopeKeys, wrappedCode);
    DemoPageComponent = factory(React, ...scopeValues) as React.ComponentType;
  } catch (err) {
    return {
      element: null,
      error: `Evaluation error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 4. Instantiate the component
  try {
    const element = React.createElement(DemoPageComponent);
    return { element, error: null };
  } catch (err) {
    return {
      element: null,
      error: `Render error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
