"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Wrench,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  Shield,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  AgentToolResponse,
  ComposioToolConfig,
  ComposioActionSchema,
  ActionConfig,
  JsonSchemaProperty,
} from "@/lib/tools/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ComposioToolSetupProps {
  agentId: string;
  toolkit: string;
  toolkitName: string;
  toolkitIcon: string;
  connectionId: string;
  existing?: AgentToolResponse;
  onSaved: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Parameter mode type
// ---------------------------------------------------------------------------

type ParamMode = "ai" | "default" | "fixed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultForType(type?: string): unknown {
  switch (type) {
    case "boolean":
      return false;
    case "number":
    case "integer":
      return 0;
    default:
      return "";
  }
}

function placeholderFromExamples(prop: JsonSchemaProperty): string | undefined {
  if (!prop.examples || prop.examples.length === 0) return undefined;
  return `e.g. ${String(prop.examples[0])}`;
}

const INPUT_CLASS =
  "w-full px-2 py-1 text-xs bg-background border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary/40";

// ---------------------------------------------------------------------------
// CharCounter — shows min/max length constraints
// ---------------------------------------------------------------------------

function CharCounter({
  value,
  minLength,
  maxLength,
}: {
  value: string;
  minLength?: number;
  maxLength?: number;
}) {
  if (minLength === undefined && maxLength === undefined) return null;
  const len = value.length;
  const outOfBounds =
    (minLength !== undefined && len < minLength) ||
    (maxLength !== undefined && len > maxLength);

  const parts: string[] = [];
  if (maxLength !== undefined) parts.push(`${len}/${maxLength}`);
  else parts.push(`${len} chars`);
  if (minLength !== undefined) parts.push(`min ${minLength}`);

  return (
    <span
      className={cn(
        "text-[9px] mt-0.5 block",
        outOfBounds ? "text-red-400/70" : "text-muted-foreground/40"
      )}
    >
      {parts.join(" · ")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// VariantSelector — oneOf / anyOf support
// ---------------------------------------------------------------------------

function VariantSelector({
  variants,
  value,
  onChange,
}: {
  variants: JsonSchemaProperty[];
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = variants[selectedIdx];

  const labels = variants.map(
    (v, i) => v.title ?? v.type ?? `Option ${i + 1}`
  );

  return (
    <div className="space-y-1">
      <select
        value={selectedIdx}
        onChange={(e) => {
          setSelectedIdx(Number(e.target.value));
          onChange(getDefaultForType(variants[Number(e.target.value)]?.type));
        }}
        className={INPUT_CLASS}
      >
        {labels.map((label, i) => (
          <option key={i} value={i}>
            {label}
          </option>
        ))}
      </select>
      {selected && !selected.oneOf && !selected.anyOf && (
        <ValueInput prop={selected} value={value} onChange={onChange} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ObjectInput — renders sub-properties for nested objects (1 level)
// ---------------------------------------------------------------------------

function ObjectInput({
  prop,
  value,
  onChange,
}: {
  prop: JsonSchemaProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const properties = prop.properties ?? {};
  const entries = Object.entries(properties);
  const obj = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;

  // > 6 fields → JSON textarea fallback
  if (entries.length === 0 || entries.length > 6) {
    return (
      <textarea
        value={
          typeof value === "string"
            ? value
            : JSON.stringify(value ?? {}, null, 2)
        }
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            onChange(e.target.value);
          }
        }}
        rows={3}
        className={cn(INPUT_CLASS, "font-mono resize-none")}
        placeholder="{}"
      />
    );
  }

  return (
    <div className="space-y-1.5 pl-2 border-l border-border/20">
      {entries.map(([name, subProp]) => (
        <div key={name}>
          <span className="text-[9px] text-muted-foreground/60 font-medium">
            {subProp.title || name}
            {subProp.type ? (
              <span className="text-muted-foreground/30 ml-1">
                {subProp.type}
              </span>
            ) : null}
          </span>
          {/* Sub-objects fall back to JSON textarea */}
          {subProp.type === "object" ? (
            <textarea
              value={
                typeof obj[name] === "string"
                  ? (obj[name] as string)
                  : JSON.stringify(obj[name] ?? {}, null, 2)
              }
              onChange={(e) => {
                try {
                  onChange({ ...obj, [name]: JSON.parse(e.target.value) });
                } catch {
                  onChange({ ...obj, [name]: e.target.value });
                }
              }}
              rows={2}
              className={cn(INPUT_CLASS, "font-mono resize-none")}
              placeholder="{}"
            />
          ) : (
            <ValueInput
              prop={subProp}
              value={obj[name]}
              onChange={(v) => onChange({ ...obj, [name]: v })}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ValueInput — renders the right input for a JSON Schema property
// ---------------------------------------------------------------------------

function ValueInput({
  prop,
  value,
  onChange,
}: {
  prop: JsonSchemaProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const placeholder =
    placeholderFromExamples(prop) ??
    (prop.default !== undefined ? String(prop.default) : "");

  // const → readonly display
  if (prop.const !== undefined) {
    return (
      <div className="px-2 py-1 text-xs bg-muted/50 border border-border/30 rounded text-muted-foreground">
        {String(prop.const)}{" "}
        <span className="text-[9px] italic">(fixed)</span>
      </div>
    );
  }

  // enum → <select>
  if (prop.enum && prop.enum.length > 0) {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      >
        <option value="">Select...</option>
        {prop.enum.map((v) => (
          <option key={String(v)} value={String(v)}>
            {String(v)}
          </option>
        ))}
      </select>
    );
  }

  // oneOf / anyOf → variant selector
  const variants = prop.oneOf ?? prop.anyOf;
  if (variants && variants.length > 1) {
    return (
      <VariantSelector variants={variants} value={value} onChange={onChange} />
    );
  }

  // boolean → toggle
  if (prop.type === "boolean") {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={cn(
          "w-9 h-5 rounded-full transition-colors relative",
          value ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
            value ? "left-[18px]" : "left-0.5"
          )}
        />
      </button>
    );
  }

  // number / integer → with min/max
  if (prop.type === "number" || prop.type === "integer") {
    return (
      <input
        type="number"
        value={value === undefined || value === null ? "" : Number(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        min={prop.minimum}
        max={prop.maximum}
        step={prop.type === "integer" ? 1 : undefined}
        className={INPUT_CLASS}
        placeholder={placeholder}
      />
    );
  }

  // format-specific inputs
  if (prop.format === "date-time") {
    return (
      <input
        type="datetime-local"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
    );
  }
  if (prop.format === "date") {
    return (
      <input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
    );
  }
  if (prop.format === "time") {
    return (
      <input
        type="time"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
    );
  }
  if (prop.format === "email") {
    return (
      <input
        type="email"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
        placeholder={placeholder || "user@example.com"}
      />
    );
  }
  if (prop.format === "uri") {
    return (
      <input
        type="url"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
        placeholder={placeholder || "https://"}
      />
    );
  }

  // array → JSON textarea
  if (prop.type === "array") {
    return (
      <textarea
        value={
          typeof value === "string"
            ? value
            : JSON.stringify(value ?? [], null, 2)
        }
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            onChange(e.target.value);
          }
        }}
        rows={3}
        className={cn(INPUT_CLASS, "font-mono resize-none")}
        placeholder={placeholder || "[]"}
      />
    );
  }

  // object with properties → nested input
  if (prop.type === "object" && prop.properties) {
    return <ObjectInput prop={prop} value={value} onChange={onChange} />;
  }

  // object without properties → JSON textarea
  if (prop.type === "object") {
    return (
      <textarea
        value={
          typeof value === "string"
            ? value
            : JSON.stringify(value ?? {}, null, 2)
        }
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            onChange(e.target.value);
          }
        }}
        rows={3}
        className={cn(INPUT_CLASS, "font-mono resize-none")}
        placeholder="{}"
      />
    );
  }

  // Default: text input with optional character counter
  const strVal = String(value ?? "");
  const hasLengthConstraint =
    prop.minLength !== undefined || prop.maxLength !== undefined;

  return (
    <div>
      <input
        type="text"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
        placeholder={placeholder}
        maxLength={prop.maxLength}
      />
      {hasLengthConstraint && (
        <CharCounter
          value={strVal}
          minLength={prop.minLength}
          maxLength={prop.maxLength}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParameterConfigPanel — three-state per-parameter configuration
// ---------------------------------------------------------------------------

function ParameterConfigPanel({
  schema,
  pinnedParams,
  defaultParams,
  onPinnedUpdate,
  onDefaultUpdate,
}: {
  schema: NonNullable<ComposioActionSchema["inputSchema"]>;
  pinnedParams: Record<string, unknown>;
  defaultParams: Record<string, unknown>;
  onPinnedUpdate: (params: Record<string, unknown>) => void;
  onDefaultUpdate: (params: Record<string, unknown>) => void;
}) {
  const properties = schema.properties ?? {};
  const requiredSet = useMemo(
    () => new Set(schema.required ?? []),
    [schema.required]
  );

  const entries = useMemo(() => Object.entries(properties), [properties]);

  if (entries.length === 0) {
    return (
      <div className="px-2.5 pb-2.5 pt-1 border-t border-border/20">
        <p className="text-[10px] text-muted-foreground/60 italic">
          No configurable parameters.
        </p>
      </div>
    );
  }

  const getMode = (name: string): ParamMode =>
    name in pinnedParams ? "fixed" : name in defaultParams ? "default" : "ai";

  const handleModeChange = (fieldName: string, newMode: ParamMode) => {
    const prop = properties[fieldName];
    const currentValue =
      pinnedParams[fieldName] ??
      defaultParams[fieldName] ??
      prop?.default ??
      getDefaultForType(prop?.type);

    const nextPinned = { ...pinnedParams };
    const nextDefault = { ...defaultParams };

    delete nextPinned[fieldName];
    delete nextDefault[fieldName];

    if (newMode === "fixed") {
      nextPinned[fieldName] = currentValue;
    } else if (newMode === "default") {
      nextDefault[fieldName] = currentValue;
    }

    onPinnedUpdate(nextPinned);
    onDefaultUpdate(nextDefault);
  };

  const updateValue = (
    fieldName: string,
    value: unknown,
    mode: ParamMode
  ) => {
    if (mode === "fixed") {
      onPinnedUpdate({ ...pinnedParams, [fieldName]: value });
    } else if (mode === "default") {
      onDefaultUpdate({ ...defaultParams, [fieldName]: value });
    }
  };

  return (
    <div className="px-2.5 pb-2.5 pt-1 border-t border-border/20">
      <p className="text-[10px] text-muted-foreground py-1.5">
        <span className="font-medium text-foreground/70">AI</span>: model
        decides.{" "}
        <span className="font-medium text-blue-400">Default</span>: fallback if
        AI omits.{" "}
        <span className="font-medium text-amber-400">Fixed</span>: always used,
        hidden from AI.
      </p>
      <div className="space-y-2.5">
        {entries.map(([name, prop]) => {
          const mode = getMode(name);
          const isConst = prop.const !== undefined;

          return (
            <div key={name}>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-medium truncate">
                    {prop.title || name}
                  </span>
                  {requiredSet.has(name) && (
                    <span className="text-[9px] text-red-400 shrink-0">
                      required
                    </span>
                  )}
                  <span className="text-[9px] text-muted-foreground/50 shrink-0">
                    {prop.type}
                    {prop.format ? ` (${prop.format})` : ""}
                  </span>
                  {prop.description && (
                    <button
                      type="button"
                      className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                      title={prop.description}
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  )}
                  {prop.deprecated && (
                    <span className="text-[9px] text-orange-400 shrink-0">
                      deprecated
                    </span>
                  )}
                </div>

                {/* Mode selector */}
                {!isConst && (
                  <div className="flex items-center gap-0 rounded border border-border/30 overflow-hidden shrink-0">
                    {(["ai", "default", "fixed"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleModeChange(name, m)}
                        className={cn(
                          "px-1.5 py-0.5 text-[9px] font-medium transition-colors",
                          mode === m
                            ? m === "fixed"
                              ? "bg-amber-500/20 text-amber-400"
                              : m === "default"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-muted text-muted-foreground"
                            : "text-muted-foreground/40 hover:text-muted-foreground"
                        )}
                      >
                        {m === "ai"
                          ? "AI"
                          : m === "default"
                            ? "Default"
                            : "Fixed"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Value input (for non-AI modes and const) */}
              {isConst ? (
                <div className="mt-1">
                  <ValueInput prop={prop} value={prop.const} onChange={() => {}} />
                </div>
              ) : mode !== "ai" ? (
                <div className="mt-1">
                  {/* Nullable toggle */}
                  {prop.nullable && (
                    <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          (mode === "fixed" ? pinnedParams[name] : defaultParams[name]) === null
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateValue(name, null, mode);
                          } else {
                            updateValue(
                              name,
                              prop.default ?? getDefaultForType(prop.type),
                              mode
                            );
                          }
                        }}
                        className="w-3 h-3 rounded border-border/50"
                      />
                      <span className="text-[9px] text-muted-foreground/60">
                        null
                      </span>
                    </label>
                  )}
                  {/* Actual value input (hidden when nullable and value is null) */}
                  {!(
                    prop.nullable &&
                    (mode === "fixed" ? pinnedParams[name] : defaultParams[name]) === null
                  ) && (
                    <ValueInput
                      prop={prop}
                      value={
                        mode === "fixed"
                          ? pinnedParams[name]
                          : defaultParams[name]
                      }
                      onChange={(v) => updateValue(name, v, mode)}
                    />
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionMetadata — informational display for action-level metadata
// ---------------------------------------------------------------------------

function ActionMetadata({ action }: { action: ComposioActionSchema }) {
  const [showOutput, setShowOutput] = useState(false);
  const hasTags = action.tags && action.tags.length > 0;
  const hasScopes = action.scopes && action.scopes.length > 0;
  const hasOutput =
    action.outputSchema && Object.keys(action.outputSchema).length > 0;

  if (!hasTags && !hasScopes && !action.noAuth && !hasOutput) return null;

  return (
    <div className="px-2.5 pb-2 pt-1 border-t border-border/20 space-y-1.5">
      {/* Tags */}
      {hasTags && (
        <div className="flex items-center gap-1 flex-wrap">
          <Tag className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />
          {action.tags!.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 bg-muted/50 text-muted-foreground/70 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Scopes */}
      {hasScopes && (
        <div className="flex items-start gap-1">
          <Shield className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0 mt-0.5" />
          <span className="text-[10px] text-muted-foreground/60">
            Permissions: {action.scopes!.join(", ")}
          </span>
        </div>
      )}

      {/* No auth */}
      {action.noAuth && (
        <p className="text-[10px] text-emerald-400/70">
          No authentication required
        </p>
      )}

      {/* Output schema */}
      {hasOutput && (
        <div>
          <button
            type="button"
            onClick={() => setShowOutput(!showOutput)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {showOutput ? (
              <ChevronDown className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
            Returns
          </button>
          {showOutput && (
            <div className="mt-1 pl-3.5 space-y-0.5">
              {Object.entries(action.outputSchema!).map(([name, prop]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground/70">
                    {name}
                  </span>
                  <span className="text-[9px] text-muted-foreground/40">
                    {prop.type}
                    {prop.format ? ` (${prop.format})` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ComposioToolSetup({
  agentId,
  toolkit,
  toolkitName,
  toolkitIcon,
  connectionId,
  existing,
  onSaved,
  onClose,
}: ComposioToolSetupProps) {
  // -- Data loading --
  const [actions, setActions] = useState<ComposioActionSchema[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);

  // -- Selection state --
  const [enabledActions, setEnabledActions] = useState<Set<string>>(new Set());
  const [actionConfigs, setActionConfigs] = useState<
    Record<string, ActionConfig>
  >({});

  // -- Description --
  const [description, setDescription] = useState("");

  // -- UI state --
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch actions on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setActionsLoading(true);
      try {
        const res = await fetch(
          `/api/composio/tools?toolkit=${encodeURIComponent(toolkit)}&include_schemas=true`
        );
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { tools: ComposioActionSchema[] };
          setActions(data.tools);

          // Initialize enabled actions
          if (existing) {
            const cfg = existing.config as unknown as ComposioToolConfig;
            if (cfg.enabled_actions && cfg.enabled_actions.length > 0) {
              setEnabledActions(new Set(cfg.enabled_actions));
            } else {
              // Existing tool with undefined enabled_actions = all important
              const impSlugs = data.tools
                .filter((t) => t.isImportant)
                .map((t) => t.slug);
              setEnabledActions(new Set(impSlugs));
            }
            if (cfg.action_configs) {
              setActionConfigs(cfg.action_configs);
            }
            setDescription(existing.description);
          } else {
            // New tool: default to all important
            const impSlugs = data.tools
              .filter((t) => t.isImportant)
              .map((t) => t.slug);
            setEnabledActions(new Set(impSlugs));
          }
        }
      } catch {
        // Non-critical — show empty list
      } finally {
        if (!cancelled) setActionsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [toolkit, existing]);

  // -- Handlers --

  const handleToggleAction = useCallback((slug: string) => {
    setEnabledActions((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const handleUpdateActionConfig = useCallback(
    (
      actionSlug: string,
      pinned: Record<string, unknown>,
      defaults: Record<string, unknown>
    ) => {
      setActionConfigs((prev) => {
        const next = { ...prev };
        const hasPinned = Object.keys(pinned).length > 0;
        const hasDefaults = Object.keys(defaults).length > 0;

        if (!hasPinned && !hasDefaults) {
          delete next[actionSlug];
        } else {
          next[actionSlug] = {
            pinned_params: pinned,
            ...(hasDefaults ? { default_params: defaults } : {}),
          };
        }
        return next;
      });
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);

    const enabledArray = Array.from(enabledActions);

    // Only include action_configs for enabled actions with non-empty params
    const cleanedConfigs: Record<string, ActionConfig> = {};
    for (const [slug, cfg] of Object.entries(actionConfigs)) {
      if (!enabledActions.has(slug)) continue;
      const hasPinned = Object.keys(cfg.pinned_params).length > 0;
      const hasDefaults =
        cfg.default_params && Object.keys(cfg.default_params).length > 0;
      if (hasPinned || hasDefaults) {
        cleanedConfigs[slug] = {
          pinned_params: cfg.pinned_params,
          ...(hasDefaults ? { default_params: cfg.default_params } : {}),
        };
      }
    }

    const config = {
      toolkit,
      toolkit_name: toolkitName,
      toolkit_icon: toolkitIcon,
      connection_id: connectionId,
      enabled_actions: enabledArray.length > 0 ? enabledArray : undefined,
      action_configs:
        Object.keys(cleanedConfigs).length > 0 ? cleanedConfigs : undefined,
    };

    try {
      let res: Response;
      if (existing) {
        res = await fetch(`/api/agents/${agentId}/tools/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: description.trim(), config }),
        });
      } else {
        res = await fetch(`/api/agents/${agentId}/tools`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool_type: "composio",
            display_name: toolkitName,
            description: description.trim(),
            config,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(
          (data as { error?: string }).error ??
            "Failed to save tool. Please try again."
        );
        return;
      }

      onSaved();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    agentId,
    toolkit,
    toolkitName,
    toolkitIcon,
    connectionId,
    enabledActions,
    actionConfigs,
    description,
    existing,
    onSaved,
  ]);

  const handleDelete = useCallback(async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      await fetch(`/api/agents/${agentId}/tools/${existing.id}`, {
        method: "DELETE",
      });
      onSaved();
    } catch {
      // Silent
    } finally {
      setDeleting(false);
    }
  }, [agentId, existing, onSaved]);

  const canSave = enabledActions.size > 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2.5">
            {toolkitIcon.startsWith("http") ? (
              <img
                src={toolkitIcon}
                alt={toolkitName}
                className="w-6 h-6 object-contain rounded"
              />
            ) : (
              <span className="text-xl">{toolkitIcon}</span>
            )}
            <span>
              {existing ? `Edit ${toolkitName}` : `Add ${toolkitName}`}
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure which {toolkitName} actions your agent can use.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-5 space-y-5">
          {/* ── Agent instructions ────────────────────────────────────── */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Agent instructions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1.5 w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50"
              placeholder={`e.g. Use ${toolkitName} when the user asks to send emails or check their inbox`}
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Tells your agent when and how to use {toolkitName}.
            </p>
          </div>

          {/* ── Action toggle list ────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Actions
              </label>
              {!actionsLoading && (
                <span className="text-[10px] text-muted-foreground">
                  {enabledActions.size} of {actions.length} enabled
                </span>
              )}
            </div>

            {actionsLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loading actions...
                </span>
              </div>
            ) : actions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No actions found for this app.
              </p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                {actions.map((action) => {
                  const enabled = enabledActions.has(action.slug);
                  const expanded = expandedAction === action.slug;
                  const cfg = actionConfigs[action.slug];
                  const fixedCount = cfg
                    ? Object.keys(cfg.pinned_params).length
                    : 0;
                  const defaultCount =
                    cfg?.default_params
                      ? Object.keys(cfg.default_params).length
                      : 0;

                  return (
                    <div
                      key={action.slug}
                      className={cn(
                        "rounded-lg border transition-colors",
                        enabled
                          ? "border-primary/20 bg-primary/[0.03]"
                          : "border-border/30"
                      )}
                    >
                      {/* Action row */}
                      <div className="flex items-center gap-2.5 p-2.5">
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleAction(action.slug)}
                          className={cn(
                            "w-8 h-[18px] rounded-full transition-colors relative shrink-0",
                            enabled
                              ? "bg-primary"
                              : "bg-muted-foreground/20"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform shadow-sm",
                              enabled ? "left-[16px]" : "left-[2px]"
                            )}
                          />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                enabled
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {action.name}
                            </span>
                            {action.isImportant && (
                              <span className="text-[9px] text-primary/60 bg-primary/10 px-1 rounded">
                                important
                              </span>
                            )}
                            {fixedCount > 0 && (
                              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded">
                                {fixedCount} fixed
                              </span>
                            )}
                            {defaultCount > 0 && (
                              <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1 rounded">
                                {defaultCount} default
                              </span>
                            )}
                            {action.isDeprecated && (
                              <span className="flex items-center gap-0.5 text-[9px] text-orange-400 bg-orange-500/10 px-1 rounded">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                deprecated
                              </span>
                            )}
                          </div>
                          {action.description && (
                            <p
                              className={cn(
                                "text-[10px] mt-0.5 line-clamp-1",
                                enabled
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/50"
                              )}
                            >
                              {action.description}
                            </p>
                          )}
                        </div>

                        {/* Expand chevron for details */}
                        {enabled && (action.inputSchema || action.tags?.length || action.scopes?.length || action.outputSchema || action.noAuth) && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAction(expanded ? null : action.slug)
                            }
                            className="p-1 rounded hover:bg-muted/50 shrink-0"
                          >
                            <ChevronDown
                              className={cn(
                                "w-3.5 h-3.5 text-muted-foreground transition-transform",
                                expanded && "rotate-180"
                              )}
                            />
                          </button>
                        )}
                      </div>

                      {/* Expanded details */}
                      {expanded && enabled && (
                        <>
                          <ActionMetadata action={action} />
                          {action.inputSchema && (
                            <ParameterConfigPanel
                              schema={action.inputSchema}
                              pinnedParams={cfg?.pinned_params ?? {}}
                              defaultParams={cfg?.default_params ?? {}}
                              onPinnedUpdate={(pinned) =>
                                handleUpdateActionConfig(
                                  action.slug,
                                  pinned,
                                  cfg?.default_params ?? {}
                                )
                              }
                              onDefaultUpdate={(defaults) =>
                                handleUpdateActionConfig(
                                  action.slug,
                                  cfg?.pinned_params ?? {},
                                  defaults
                                )
                              }
                            />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Delete (edit mode only) ───────────────────────────────── */}
          {existing && (
            <div className="pt-2 border-t border-border/30">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400">
                    Remove this tool?
                  </span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2.5 py-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-md hover:bg-red-500/20"
                  >
                    {deleting ? "Removing..." : "Yes, remove"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                  Remove {toolkitName} from agent
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────────────── */}
        {saveError && (
          <div className="mx-6 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
            {saveError}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-lg transition-colors",
              canSave && !saving
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            ) : existing ? (
              "Save Changes"
            ) : (
              <span className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5" />
                Add to Agent
              </span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
