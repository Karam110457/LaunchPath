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
  Bot,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { NodeModal } from "../NodeModal";
import { cn } from "@/lib/utils";
import type {
  AgentToolResponse,
  ComposioToolConfig,
  ComposioActionSchema,
  ActionConfig,
  JsonSchemaProperty,
} from "@/lib/tools/types";
import { useComposioConnections } from "@/hooks/useComposioConnections";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ComposioToolSetupProps {
  agentId: string;
  toolkit: string;
  toolkitName: string;
  toolkitIcon: string;
  connectionId?: string;
  existing?: AgentToolResponse;
  onSaved: () => void;
  onClose: () => void;
}

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

function humanLabel(name: string, prop: JsonSchemaProperty): string {
  if (prop.title) return prop.title;
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const INPUT_BASE =
  "w-full px-3 py-2 text-xs bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30";

// ---------------------------------------------------------------------------
// ArrayInput — add/remove items UI (like screenshot)
// ---------------------------------------------------------------------------

function ArrayInput({
  value,
  onChange,
  label,
  itemType,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  label: string;
  itemType?: JsonSchemaProperty;
}) {
  const items: unknown[] = Array.isArray(value) ? value : [];

  const addItem = () => {
    const defaultVal =
      itemType?.type === "number" || itemType?.type === "integer"
        ? 0
        : itemType?.type === "boolean"
          ? false
          : "";
    onChange([...items, defaultVal]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, val: unknown) => {
    const next = [...items];
    next[index] = val;
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={String(item ?? "")}
            onChange={(e) => updateItem(i, e.target.value)}
            className={cn(INPUT_BASE, "flex-1")}
            placeholder={`Item ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-1.5 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground border border-dashed border-border/40 hover:border-border/60 rounded-lg transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add {label.toLowerCase()}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ValueInput — renders type-specific inputs
// ---------------------------------------------------------------------------

function ValueInput({
  prop,
  value,
  onChange,
  fieldName,
  label,
}: {
  prop: JsonSchemaProperty;
  value: unknown;
  onChange: (v: unknown) => void;
  fieldName?: string;
  label?: string;
}) {
  const displayLabel = label ?? fieldName ?? "";
  const placeholder =
    placeholderFromExamples(prop) ??
    (prop.default !== undefined
      ? String(prop.default)
      : displayLabel
        ? `Enter ${displayLabel.toLowerCase()}`
        : "");

  // const → readonly chip
  if (prop.const !== undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border border-border/30 rounded-lg">
        <Lock className="w-3 h-3 text-muted-foreground/50" />
        <span className="text-xs text-muted-foreground">
          {String(prop.const)}
        </span>
        <span className="text-[9px] text-muted-foreground/40 italic">
          locked
        </span>
      </div>
    );
  }

  // enum → styled select
  if (prop.enum && prop.enum.length > 0) {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={cn(INPUT_BASE, "appearance-none cursor-pointer")}
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
      <VariantSelector
        variants={variants}
        value={value}
        onChange={onChange}
        label={displayLabel}
      />
    );
  }

  // boolean → toggle next to label
  if (prop.type === "boolean") {
    const isOn = !!value;
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="flex items-center gap-3"
      >
        <div
          className={cn(
            "w-11 h-6 rounded-full transition-colors relative",
            isOn ? "bg-primary" : "bg-muted-foreground/20"
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform shadow-sm",
              isOn ? "left-[22px]" : "left-[3px]"
            )}
          />
        </div>
      </button>
    );
  }

  // number / integer → slider + number
  if (prop.type === "number" || prop.type === "integer") {
    const numVal =
      value === undefined || value === null || value === ""
        ? ((prop.default as number) ?? 0)
        : Number(value);
    const min = prop.minimum ?? 0;
    const max = prop.maximum ?? 100;
    const step = prop.type === "integer" ? 1 : 0.1;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <input
            type="range"
            value={numVal}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="flex-1 h-1.5 rounded-full appearance-none bg-muted-foreground/20 accent-primary cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
          />
          <input
            type="number"
            value={numVal}
            onChange={(e) =>
              onChange(e.target.value === "" ? 0 : Number(e.target.value))
            }
            min={min}
            max={max}
            step={step}
            className="w-16 px-2 py-1 text-xs text-center bg-muted/30 border border-border/40 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>
    );
  }

  // format-specific inputs
  if (prop.format === "date-time") {
    return (
      <input
        type="datetime-local"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_BASE}
      />
    );
  }
  if (prop.format === "date") {
    return (
      <input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_BASE}
      />
    );
  }
  if (prop.format === "time") {
    return (
      <input
        type="time"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_BASE}
      />
    );
  }
  if (prop.format === "email") {
    return (
      <input
        type="email"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_BASE}
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
        className={INPUT_BASE}
        placeholder={placeholder || "https://"}
      />
    );
  }

  // array → add/remove items list
  if (prop.type === "array") {
    return (
      <ArrayInput
        value={value}
        onChange={onChange}
        label={displayLabel || "item"}
        itemType={prop.items}
      />
    );
  }

  // object with sub-properties → nested fields
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
        className={cn(INPUT_BASE, "font-mono resize-none")}
        placeholder="{}"
      />
    );
  }

  // Default: text input
  const strVal = String(value ?? "");
  const hasLengthConstraint =
    prop.minLength !== undefined || prop.maxLength !== undefined;

  // Auto-detect long text fields
  const nameLower = (fieldName ?? "").toLowerCase();
  const isLongText =
    nameLower.includes("body") ||
    nameLower.includes("description") ||
    nameLower.includes("content") ||
    nameLower.includes("message") ||
    nameLower.includes("text") ||
    (prop.maxLength !== undefined && prop.maxLength > 200);

  if (isLongText) {
    return (
      <div>
        <textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cn(INPUT_BASE, "resize-none")}
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

  return (
    <div>
      <input
        type="text"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_BASE}
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
// CharCounter
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
        "text-[9px] mt-1 block text-right",
        outOfBounds ? "text-red-400/70" : "text-muted-foreground/40"
      )}
    >
      {parts.join(" · ")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// VariantSelector — oneOf / anyOf
// ---------------------------------------------------------------------------

function VariantSelector({
  variants,
  value,
  onChange,
  label,
}: {
  variants: JsonSchemaProperty[];
  value: unknown;
  onChange: (v: unknown) => void;
  label?: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = variants[selectedIdx];

  const labels = variants.map(
    (v, i) => v.title ?? v.type ?? `Option ${i + 1}`
  );

  return (
    <div className="space-y-2">
      <select
        value={selectedIdx}
        onChange={(e) => {
          setSelectedIdx(Number(e.target.value));
          onChange(getDefaultForType(variants[Number(e.target.value)]?.type));
        }}
        className={cn(INPUT_BASE, "appearance-none cursor-pointer")}
      >
        {labels.map((l, i) => (
          <option key={i} value={i}>
            {l}
          </option>
        ))}
      </select>
      {selected && !selected.oneOf && !selected.anyOf && (
        <ValueInput
          prop={selected}
          value={value}
          onChange={onChange}
          label={label}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ObjectInput — nested object fields (1 level)
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
        className={cn(INPUT_BASE, "font-mono resize-none")}
        placeholder="{}"
      />
    );
  }

  return (
    <div className="space-y-2 pl-3 border-l-2 border-primary/10">
      {entries.map(([fieldName, subProp]) => (
        <div key={fieldName}>
          <label className="text-[10px] font-medium text-muted-foreground/70 mb-1 block">
            {subProp.title || fieldName}
            {subProp.type && (
              <span className="text-muted-foreground/30 ml-1 font-normal">
                {subProp.type}
              </span>
            )}
          </label>
          {subProp.type === "object" ? (
            <textarea
              value={
                typeof obj[fieldName] === "string"
                  ? (obj[fieldName] as string)
                  : JSON.stringify(obj[fieldName] ?? {}, null, 2)
              }
              onChange={(e) => {
                try {
                  onChange({
                    ...obj,
                    [fieldName]: JSON.parse(e.target.value),
                  });
                } catch {
                  onChange({ ...obj, [fieldName]: e.target.value });
                }
              }}
              rows={2}
              className={cn(INPUT_BASE, "font-mono resize-none")}
              placeholder="{}"
            />
          ) : (
            <ValueInput
              prop={subProp}
              value={obj[fieldName]}
              onChange={(v) => onChange({ ...obj, [fieldName]: v })}
              fieldName={fieldName}
              label={subProp.title || fieldName}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParameterConfigPanel — BuildMyAgent-style: input with AI overlay
// ---------------------------------------------------------------------------

function ParameterConfigPanel({
  schema,
  pinnedParams,
  onPinnedUpdate,
}: {
  schema: NonNullable<ComposioActionSchema["inputSchema"]>;
  pinnedParams: Record<string, unknown>;
  onPinnedUpdate: (params: Record<string, unknown>) => void;
}) {
  const properties = schema.properties ?? {};
  const requiredSet = useMemo(
    () => new Set(schema.required ?? []),
    [schema.required]
  );

  const entries = useMemo(() => Object.entries(properties), [properties]);

  if (entries.length === 0) {
    return (
      <div className="px-3 pb-3 pt-2 border-t border-border/20">
        <p className="text-[11px] text-muted-foreground/50 italic">
          No configurable parameters.
        </p>
      </div>
    );
  }

  const isHardcoded = (name: string) => name in pinnedParams;

  const setHardcoded = (fieldName: string) => {
    const prop = properties[fieldName];
    const currentValue =
      pinnedParams[fieldName] ??
      prop?.default ??
      getDefaultForType(prop?.type);
    onPinnedUpdate({ ...pinnedParams, [fieldName]: currentValue });
  };

  const setAi = (fieldName: string) => {
    const next = { ...pinnedParams };
    delete next[fieldName];
    onPinnedUpdate(next);
  };

  const updateValue = (fieldName: string, value: unknown) => {
    onPinnedUpdate({ ...pinnedParams, [fieldName]: value });
  };

  return (
    <div className="px-3 pb-3 pt-2 border-t border-border/20">
      <div className="space-y-2.5">
        {entries.map(([name, prop]) => {
          const hardcoded = isHardcoded(name);
          const isConst = prop.const !== undefined;
          const label = humanLabel(name, prop);
          const isBool = prop.type === "boolean";

          return (
            <div key={name}>
              {/* Label row */}
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[11px] font-medium text-foreground/80">
                  {label}
                </span>
                {requiredSet.has(name) && (
                  <span className="text-[9px] text-red-400/80 font-medium">
                    *
                  </span>
                )}
                {prop.description && (
                  <button
                    type="button"
                    className="text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors"
                    title={prop.description}
                  >
                    <Info className="w-3 h-3" />
                  </button>
                )}
                {prop.deprecated && (
                  <span className="text-[9px] text-orange-400/80">
                    deprecated
                  </span>
                )}
              </div>

              {/* Input area */}
              {isConst ? (
                <ValueInput
                  prop={prop}
                  value={prop.const}
                  onChange={() => { }}
                  fieldName={name}
                  label={label}
                />
              ) : hardcoded ? (
                <div>
                  {/* Nullable toggle */}
                  {prop.nullable && (
                    <label className="flex items-center gap-2 mb-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pinnedParams[name] === null}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateValue(name, null);
                          } else {
                            updateValue(
                              name,
                              prop.default ?? getDefaultForType(prop.type)
                            );
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-border/50 accent-primary"
                      />
                      <span className="text-[10px] text-muted-foreground/60">
                        Set to null
                      </span>
                    </label>
                  )}
                  {/* Value input (hidden if nullable and null) */}
                  {!(prop.nullable && pinnedParams[name] === null) && (
                    <ValueInput
                      prop={prop}
                      value={pinnedParams[name]}
                      onChange={(v) => updateValue(name, v)}
                      fieldName={name}
                      label={label}
                    />
                  )}
                </div>
              ) : isBool ? (
                /* Boolean AI mode: chip + toggle side by side */
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-background border border-border/50 rounded-lg">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-primary/70 font-medium">
                    <Bot className="w-3 h-3" />
                    Determined by AI
                  </span>
                  <button
                    type="button"
                    onClick={() => setHardcoded(name)}
                    className="p-0.5 rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : prop.type === "number" || prop.type === "integer" ? (
                /* Number AI mode: chip overlaying a dimmed slider area */
                <div className="relative">
                  <div className="px-3 py-2 bg-background border border-border/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-primary/70 font-medium">
                        <Bot className="w-3 h-3" />
                        Determined by AI
                      </span>
                      <button
                        type="button"
                        onClick={() => setHardcoded(name)}
                        className="p-0.5 rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : prop.type === "array" ? (
                /* Array AI mode */
                <div className="px-3 py-2 bg-background border border-border/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-primary/70 font-medium">
                      <Bot className="w-3 h-3" />
                      Determined by AI
                    </span>
                    <button
                      type="button"
                      onClick={() => setHardcoded(name)}
                      className="p-0.5 rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Default AI mode: input-shaped container with chip overlay */
                <div className="relative">
                  <div
                    className={cn(
                      "flex items-center gap-2 bg-background border border-border/50 rounded-lg overflow-hidden",
                      isLongTextField(name)
                        ? "px-3 pt-8 pb-2 min-h-[80px] items-end"
                        : "px-3 py-2"
                    )}
                  >
                    {/* Faded placeholder text */}
                    {!isLongTextField(name) && (
                      <span className="text-xs text-muted-foreground/20 flex-1 truncate">
                        {placeholderFromExamples(prop) ||
                          `Enter ${label.toLowerCase()}`}
                      </span>
                    )}
                    {isLongTextField(name) && (
                      <span className="absolute top-2 left-3 text-xs text-muted-foreground/20">
                        {`Enter ${label.toLowerCase()}`}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-primary/70 font-medium whitespace-nowrap shrink-0">
                      <Bot className="w-3 h-3" />
                      Determined by AI
                    </span>
                    <button
                      type="button"
                      onClick={() => setHardcoded(name)}
                      className="p-0.5 rounded-full text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isLongTextField(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("body") ||
    n.includes("description") ||
    n.includes("content") ||
    n.includes("message") ||
    n.includes("text")
  );
}

// ---------------------------------------------------------------------------
// ActionMetadata — output schema only
// ---------------------------------------------------------------------------

function ActionMetadata({ action }: { action: ComposioActionSchema }) {
  const [showOutput, setShowOutput] = useState(false);
  const hasOutput =
    action.outputSchema && Object.keys(action.outputSchema).length > 0;

  if (!action.noAuth && !hasOutput) return null;

  return (
    <div className="px-3 pb-2 pt-1.5 border-t border-border/20 space-y-1.5">
      {action.noAuth && (
        <p className="text-[10px] text-emerald-400/70">
          No authentication required
        </p>
      )}

      {hasOutput && (
        <div>
          <button
            type="button"
            onClick={() => setShowOutput(!showOutput)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {showOutput ? (
              <ChevronDown className="w-2.5 h-2.5" />
            ) : (
              <ChevronRight className="w-2.5 h-2.5" />
            )}
            What this action returns
          </button>
          {showOutput && (
            <div className="mt-1 pl-3.5 space-y-0.5">
              {Object.entries(action.outputSchema!).map(([fieldName, prop]) => (
                <div key={fieldName} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {fieldName}
                  </span>
                  <span className="text-[9px] text-muted-foreground/30">
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
  const { connect, connecting, connectError, isConnected, getConnection } = useComposioConnections();

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

          if (existing) {
            const cfg = existing.config as unknown as ComposioToolConfig;
            if (cfg.enabled_actions && cfg.enabled_actions.length > 0) {
              setEnabledActions(new Set(cfg.enabled_actions));
            } else {
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
            const impSlugs = data.tools
              .filter((t) => t.isImportant)
              .map((t) => t.slug);
            setEnabledActions(new Set(impSlugs));
          }
        }
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setActionsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [toolkit, existing]);

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

  const handleUpdatePinnedParams = useCallback(
    (actionSlug: string, pinned: Record<string, unknown>) => {
      setActionConfigs((prev) => {
        const next = { ...prev };
        if (Object.keys(pinned).length === 0) {
          delete next[actionSlug];
        } else {
          next[actionSlug] = { pinned_params: pinned };
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

    const cleanedConfigs: Record<string, ActionConfig> = {};
    for (const [slug, cfg] of Object.entries(actionConfigs)) {
      if (!enabledActions.has(slug)) continue;
      if (Object.keys(cfg.pinned_params).length > 0) {
        cleanedConfigs[slug] = { pinned_params: cfg.pinned_params };
      }
    }

    const config = {
      toolkit,
      toolkit_name: toolkitName,
      toolkit_icon: toolkitIcon,
      connection_id: connectionId || getConnection(toolkit)?.id,
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
    <NodeModal
      open
      onClose={onClose}
      title={existing ? "Configure Tool" : "Add Tool"}
    >
      <div className="flex flex-col h-full bg-background/50">
        <div className="px-5 pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
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
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure which {toolkitName} actions your agent can use.
          </p>
        </div>

        {(!connectionId && !isConnected(toolkit)) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-border/40 flex items-center justify-center mb-5 p-2.5">
              {toolkitIcon.startsWith("http") ? (
                <img src={toolkitIcon} alt={toolkitName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-3xl">{toolkitIcon}</span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Connect to {toolkitName}</h3>
            <p className="text-sm text-zinc-500 mb-8 max-w-[260px] leading-relaxed">
              Authenticate with {toolkitName} to allow your agent to perform actions on your behalf.
            </p>
            <button
              onClick={() => void connect(toolkit, toolkitName, toolkitIcon)}
              disabled={connecting === toolkit}
              className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {connecting === toolkit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {connecting === toolkit ? "Connecting..." : `Connect ${toolkitName}`}
            </button>
            {connectError?.toolkit === toolkit && (
              <p className="text-xs text-red-500 mt-4 max-w-sm">{connectError.message}</p>
            )}
            {existing && (
              <div className="mt-8 pt-6 border-t border-border/40 w-full max-w-xs">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5 w-full"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? "Removing..." : `Remove ${toolkitName} from agent`}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-5 space-y-5 pt-5">
            {/* Agent instructions */}
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

            {/* Action toggle list */}
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
                    const hardcodedCount = cfg
                      ? Object.keys(cfg.pinned_params).length
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
                              {hardcodedCount > 0 && (
                                <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded">
                                  {hardcodedCount} hardcoded
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

                          {enabled &&
                            (action.inputSchema ||
                              action.outputSchema ||
                              action.noAuth) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedAction(
                                    expanded ? null : action.slug
                                  )
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
                                onPinnedUpdate={(pinned) =>
                                  handleUpdatePinnedParams(action.slug, pinned)
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

            {/* Delete (edit mode only) */}
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
        )}

        {saveError && (
          <div className="mx-5 my-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 shrink-0">
            {saveError}
          </div>
        )}

        <div className="px-5 py-4 border-t border-border/40 flex items-center justify-between shrink-0 bg-background/50 backdrop-blur">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={(!canSave && !existing) || saving || (!connectionId && !isConnected(toolkit))}
            className={cn(
              "px-5 py-2 text-sm font-medium rounded-xl transition-all shadow-sm",
              ((canSave || existing) && !saving && (connectionId || isConnected(toolkit)))
                ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
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
      </div>
    </NodeModal>
  );
}
