"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Wrench,
  X,
  ChevronDown,
  Pin,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getPresetsForToolkit, generateToolDescription } from "@/lib/tools/presets";
import type {
  AgentToolResponse,
  ComposioToolConfig,
  ComposioActionSchema,
  ActionConfig,
  JsonSchemaProperty,
} from "@/lib/tools/types";
import type { ToolkitPreset } from "@/lib/tools/presets";

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

// ---------------------------------------------------------------------------
// PinnedValueInput — renders the right input for a JSON Schema property
// ---------------------------------------------------------------------------

function PinnedValueInput({
  prop,
  value,
  onChange,
}: {
  prop: JsonSchemaProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (prop.enum && prop.enum.length > 0) {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-xs bg-background border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary/40"
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

  if (prop.type === "number" || prop.type === "integer") {
    return (
      <input
        type="number"
        value={value === undefined || value === null ? "" : Number(value)}
        onChange={(e) =>
          onChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className="w-full px-2 py-1 text-xs bg-background border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary/40"
        placeholder={prop.default !== undefined ? String(prop.default) : ""}
      />
    );
  }

  // Default: text input
  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 text-xs bg-background border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary/40"
      placeholder={prop.default !== undefined ? String(prop.default) : ""}
    />
  );
}

// ---------------------------------------------------------------------------
// ParameterPinningPanel — expanded per-action field configuration
// ---------------------------------------------------------------------------

function ParameterPinningPanel({
  schema,
  pinnedParams,
  onUpdate,
}: {
  schema: NonNullable<ComposioActionSchema["inputSchema"]>;
  pinnedParams: Record<string, unknown>;
  onUpdate: (params: Record<string, unknown>) => void;
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

  const togglePin = (fieldName: string, currentlyPinned: boolean) => {
    const next = { ...pinnedParams };
    if (currentlyPinned) {
      delete next[fieldName];
    } else {
      const prop = properties[fieldName];
      next[fieldName] = prop?.default ?? getDefaultForType(prop?.type);
    }
    onUpdate(next);
  };

  const updateValue = (fieldName: string, value: unknown) => {
    onUpdate({ ...pinnedParams, [fieldName]: value });
  };

  return (
    <div className="px-2.5 pb-2.5 pt-1 border-t border-border/20">
      <p className="text-[10px] text-muted-foreground py-1.5">
        Pin values so your agent always uses them. Unpinned fields are decided
        by the AI at runtime.
      </p>
      <div className="space-y-2">
        {entries.map(([name, prop]) => {
          const isPinned = name in pinnedParams;
          return (
            <div key={name} className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => togglePin(name, isPinned)}
                className={cn(
                  "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0",
                  isPinned
                    ? "border-amber-400 bg-amber-500/20"
                    : "border-muted-foreground/30 hover:border-muted-foreground/50"
                )}
                title={isPinned ? "Unpin — let AI decide" : "Pin — use fixed value"}
              >
                {isPinned && <Pin className="w-2.5 h-2.5 text-amber-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium">{prop.title || name}</span>
                  {requiredSet.has(name) && (
                    <span className="text-[9px] text-red-400">required</span>
                  )}
                  <span className="text-[9px] text-muted-foreground/50">
                    {prop.type}
                  </span>
                </div>
                {prop.description && (
                  <p className="text-[10px] text-muted-foreground/60 line-clamp-1">
                    {prop.description}
                  </p>
                )}
                {isPinned ? (
                  <div className="mt-1">
                    <PinnedValueInput
                      prop={prop}
                      value={pinnedParams[name]}
                      onChange={(v) => updateValue(name, v)}
                    />
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/40 italic mt-0.5">
                    AI decides
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
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
  const [actionConfigs, setActionConfigs] = useState<Record<string, ActionConfig>>({});
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined);

  // -- Description --
  const [description, setDescription] = useState("");
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // -- UI state --
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // -- Presets --
  const presets = useMemo(() => getPresetsForToolkit(toolkit), [toolkit]);
  const hasPresets = presets.length > 0;

  // -- Derived --
  const importantActions = useMemo(
    () => actions.filter((a) => a.isImportant),
    [actions]
  );

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
            setSelectedPreset(cfg.selected_preset ?? "all_important");
            setDescription(existing.description);
            setDescriptionManuallyEdited(true);
          } else {
            // New tool: default to all important
            const impSlugs = data.tools
              .filter((t) => t.isImportant)
              .map((t) => t.slug);
            setEnabledActions(new Set(impSlugs));
            setSelectedPreset("all_important");
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

  // Auto-generate description when actions change (unless manually edited)
  useEffect(() => {
    if (descriptionManuallyEdited || actions.length === 0) return;
    const selected = actions.filter((a) => enabledActions.has(a.slug));
    const generated = generateToolDescription(toolkitName, selected);
    setDescription(generated);
  }, [enabledActions, actions, toolkitName, descriptionManuallyEdited]);

  // -- Handlers --

  const handleToggleAction = useCallback(
    (slug: string) => {
      setEnabledActions((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) {
          next.delete(slug);
        } else {
          next.add(slug);
        }
        return next;
      });
      // Any manual toggle switches to custom mode
      setSelectedPreset("custom");
    },
    []
  );

  const handleSelectPreset = useCallback(
    (preset: ToolkitPreset) => {
      // Intersect preset actions with available actions
      const available = new Set(actions.map((a) => a.slug));
      const toEnable = preset.actions.filter((s) => available.has(s));
      setEnabledActions(new Set(toEnable));
      setSelectedPreset(preset.id);
      if (!descriptionManuallyEdited) {
        setDescription(preset.description);
      }
    },
    [actions, descriptionManuallyEdited]
  );

  const handleSelectAllImportant = useCallback(() => {
    const impSlugs = importantActions.map((a) => a.slug);
    setEnabledActions(new Set(impSlugs));
    setSelectedPreset("all_important");
  }, [importantActions]);

  const handleSelectCustom = useCallback(() => {
    setSelectedPreset("custom");
  }, []);

  const handleAiGenerate = useCallback(async () => {
    setAiGenerating(true);
    try {
      const selectedActions = actions
        .filter((a) => enabledActions.has(a.slug))
        .map((a) => a.name);

      const res = await fetch(
        `/api/agents/${agentId}/tools/generate-description`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appName: toolkitName,
            actions: selectedActions,
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as { description: string };
        setDescription(data.description);
        setDescriptionManuallyEdited(true);
      }
    } catch {
      // Network error — keep current description
    } finally {
      setAiGenerating(false);
    }
  }, [agentId, toolkitName, actions, enabledActions]);

  const handleUpdatePinnedParams = useCallback(
    (actionSlug: string, params: Record<string, unknown>) => {
      setActionConfigs((prev) => {
        const next = { ...prev };
        if (Object.keys(params).length === 0) {
          delete next[actionSlug];
        } else {
          next[actionSlug] = { pinned_params: params };
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

    // Only include action_configs for enabled actions with non-empty pinned params
    const cleanedConfigs: Record<string, ActionConfig> = {};
    for (const [slug, cfg] of Object.entries(actionConfigs)) {
      if (enabledActions.has(slug) && Object.keys(cfg.pinned_params).length > 0) {
        cleanedConfigs[slug] = cfg;
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
      selected_preset: selectedPreset,
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
    selectedPreset,
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

  const canSave = description.trim().length > 0 && enabledActions.size > 0;

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
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Agent instructions
              </label>
              <div className="flex items-center gap-2">
                {descriptionManuallyEdited && (
                  <button
                    type="button"
                    onClick={() => setDescriptionManuallyEdited(false)}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || actionsLoading}
                  className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {aiGenerating ? "Generating..." : "AI Generate"}
                </button>
              </div>
            </div>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionManuallyEdited(true);
              }}
              rows={2}
              className="mt-1.5 w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/50"
              placeholder={`e.g. Use ${toolkitName} when the user asks to send emails or check their inbox`}
            />
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Tells your agent when and how to use {toolkitName}. Updates
              automatically as you toggle actions.
            </p>
          </div>

          {/* ── Use-case presets ──────────────────────────────────────── */}
          {hasPresets && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Use case
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllImportant}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-full border transition-colors",
                    selectedPreset === "all_important"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  All important
                </button>
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] rounded-full border transition-colors",
                      selectedPreset === preset.id
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className={cn(
                    "px-2.5 py-1 text-[11px] rounded-full border transition-colors",
                    selectedPreset === "custom"
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  Custom
                </button>
              </div>
            </div>
          )}

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
                  const pinnedCount = cfg
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
                            {pinnedCount > 0 && (
                              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded">
                                {pinnedCount} pinned
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

                        {/* Expand chevron for parameter pinning */}
                        {enabled && action.inputSchema && (
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

                      {/* Parameter pinning panel */}
                      {expanded && enabled && action.inputSchema && (
                        <ParameterPinningPanel
                          schema={action.inputSchema}
                          pinnedParams={cfg?.pinned_params ?? {}}
                          onUpdate={(params) =>
                            handleUpdatePinnedParams(action.slug, params)
                          }
                        />
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
