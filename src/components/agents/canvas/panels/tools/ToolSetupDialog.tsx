"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCatalogEntry } from "@/lib/tools/catalog";
import type { AgentToolResponse, TestToolResult } from "@/lib/tools/types";

interface ToolSetupDialogProps {
  agentId: string;
  toolType: string;
  existing?: AgentToolResponse;
  onSaved: () => void;
  onDeleted?: () => void;
  onClose: () => void;
}

export function ToolSetupDialog({
  agentId,
  toolType,
  existing,
  onSaved,
  onDeleted,
  onClose,
}: ToolSetupDialogProps) {
  const entry = getCatalogEntry(toolType);
  const isEdit = !!existing;

  const [displayName, setDisplayName] = useState(
    existing?.display_name ?? entry?.defaultDisplayName ?? ""
  );
  const [description, setDescription] = useState(
    existing?.description ?? entry?.defaultDescription ?? ""
  );
  const [config, setConfig] = useState<Record<string, string>>(
    existing?.config
      ? Object.fromEntries(
          Object.entries(existing.config).map(([k, v]) => [k, String(v ?? "")])
        )
      : {}
  );
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<TestToolResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isEnabled, setIsEnabled] = useState(existing?.is_enabled ?? true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // MCP-specific: discovered tools
  const [mcpTools, setMcpTools] = useState<{ name: string; description: string }[]>([]);

  useEffect(() => {
    setTestResult(null);
  }, [config]);

  if (!entry) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    // For MCP, also discover tools
    if (toolType === "mcp" && config.server_url) {
      try {
        const discoverRes = await fetch(`/api/agents/${agentId}/tools/mcp-discover`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ server_url: config.server_url }),
        });
        if (discoverRes.ok) {
          const data = (await discoverRes.json()) as {
            tools: { name: string; description: string }[];
          };
          setMcpTools(data.tools);
        }
      } catch {
        // Ignore discover errors — the test route will report the real error
      }
    }

    const res = await fetch(`/api/agents/${agentId}/tools/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool_type: toolType, config }),
    });
    const result = (await res.json()) as TestToolResult;
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const url = isEdit
      ? `/api/agents/${agentId}/tools/${existing.id}`
      : `/api/agents/${agentId}/tools`;
    const method = isEdit ? "PATCH" : "POST";

    const body = isEdit
      ? { display_name: displayName, description, config, is_enabled: isEnabled }
      : { tool_type: toolType, display_name: displayName, description, config };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Failed to save tool");
      setSaving(false);
      return;
    }

    onSaved();
  };

  const requiredFields = entry.setupFields.filter((f) => f.required);
  const canSave = requiredFields.every((f) => {
    const val = config[f.key];
    return val && val.length > 0 && !val.startsWith("••••");
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${entry.name}` : `Set up ${entry.name}`}</DialogTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {entry.tagline}
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          {/* Setup fields */}
          {entry.setupFields.length > 0 && (
            <section className="space-y-4">
              {entry.setupFields.map((field) => {
                const isPassword = field.type === "password";
                const isVisible = showPasswords[field.key] ?? false;
                const inputType = isPassword && !isVisible ? "password" : "text";

                return (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-sm">
                      {field.label}
                      {!field.required && (
                        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                      )}
                    </Label>

                    {field.type === "textarea" ? (
                      <Textarea
                        placeholder={field.placeholder}
                        value={config[field.key] ?? ""}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        rows={3}
                        className="text-sm resize-none"
                      />
                    ) : (
                      <div className="relative">
                        <Input
                          type={inputType}
                          placeholder={field.placeholder}
                          value={config[field.key] ?? ""}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className={isPassword ? "pr-9 text-sm font-mono" : "text-sm"}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                [field.key]: !isVisible,
                              }))
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {isVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {field.helpText && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {field.helpText}
                      </p>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* MCP discovered tools */}
          {toolType === "mcp" && mcpTools.length > 0 && (
            <div className="rounded-lg border border-border/60 p-3 space-y-2 bg-muted/20">
              <p className="text-xs font-medium text-foreground">
                {mcpTools.length} tool{mcpTools.length !== 1 ? "s" : ""} discovered
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {mcpTools.map((t) => (
                  <div key={t.name} className="text-xs">
                    <span className="font-mono text-primary">{t.name}</span>
                    {t.description && (
                      <span className="text-muted-foreground ml-1.5">— {t.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test connection */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleTest()}
              disabled={testing}
              className="gap-1.5 text-xs w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testing…
                </>
              ) : (
                "Test connection"
              )}
            </Button>

            {testResult && (
              <div
                className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                  testResult.success
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Advanced: customize name + description */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((p) => !p)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              Customize name &amp; description
            </button>

            {showAdvanced && (
              <div className="space-y-4 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Display name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-sm"
                    placeholder="e.g. Book a Call"
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown in the agent builder interface.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Agent instructions</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="text-sm resize-none"
                    placeholder="Describe when the agent should use this tool…"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is passed to the AI to explain when and how to use the tool.
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Enable / disable toggle (edit mode only) */}
          {isEdit && (
            <div className="flex items-center justify-between py-2 border-t border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isEnabled ? "Tool is enabled" : "Tool is disabled"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isEnabled
                    ? "Agent will use this tool during conversations"
                    : "Agent will not use this tool"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnabled((p) => !p)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  isEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {isEdit && onDeleted && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5 mr-auto">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      await fetch(`/api/agents/${agentId}/tools/${existing!.id}`, { method: "DELETE" });
                      onDeleted();
                    }}
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm remove"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-auto"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Remove
                </Button>
              )
            )}
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!canSave || saving}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add tool"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
