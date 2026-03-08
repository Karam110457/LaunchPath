"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from "lucide-react";
import { NodeModal } from "../NodeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentToolResponse, TestToolResult } from "@/lib/tools/types";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const AUTH_TYPES = [
  { value: "none", label: "None" },
  { value: "bearer", label: "Bearer Token" },
  { value: "api_key", label: "API Key" },
  { value: "basic", label: "Basic Auth" },
] as const;

interface HttpToolSetupProps {
  agentId: string;
  existing?: AgentToolResponse;
  onSaved: () => void;
  onClose: () => void;
}

export function HttpToolSetup({
  agentId,
  existing,
  onSaved,
  onClose,
}: HttpToolSetupProps) {
  const isEdit = !!existing;
  const existingConfig = existing?.config as Record<string, unknown> | undefined;

  // Form state
  const [url, setUrl] = useState((existingConfig?.url as string) || "");
  const [method, setMethod] = useState<string>(
    (existingConfig?.method as string) || "GET"
  );
  const [authType, setAuthType] = useState<string>(
    (existingConfig?.auth_type as string) || "none"
  );
  const [authConfig, setAuthConfig] = useState<Record<string, string>>(() => {
    const ac = existingConfig?.auth_config as Record<string, string> | undefined;
    return ac ?? {};
  });
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>(
    () => {
      const h = existingConfig?.headers as Record<string, string> | undefined;
      return h
        ? Object.entries(h).map(([key, value]) => ({ key, value }))
        : [];
    }
  );
  const [responsePath, setResponsePath] = useState(
    (existingConfig?.response_path as string) || ""
  );
  const [bodyDescription, setBodyDescription] = useState(
    (existingConfig?.body_description as string) || ""
  );
  const [displayName, setDisplayName] = useState(
    existing?.display_name || "API Request"
  );
  const [description, setDescription] = useState(
    existing?.description ||
    "Send HTTP requests to an external API to fetch data or trigger actions."
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestToolResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset test result when config changes
  useEffect(() => {
    setTestResult(null);
  }, [url, method, authType]);

  const buildConfig = () => {
    const headersObj: Record<string, string> = {};
    for (const h of headers) {
      if (h.key.trim()) headersObj[h.key.trim()] = h.value;
    }

    return {
      url,
      method,
      auth_type: authType,
      auth_config: authType !== "none" ? authConfig : undefined,
      headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
      response_path: responsePath || undefined,
      body_description: bodyDescription || undefined,
    };
  };

  const canSave = url.trim().length > 0 && method;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        tool_type: "http",
        display_name: displayName.trim(),
        description: description.trim(),
        config: buildConfig(),
      };

      const endpoint = isEdit
        ? `/api/agents/${agentId}/tools/${existing.id}`
        : `/api/agents/${agentId}/tools`;
      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSaved();
      } else {
        const body = await res.json().catch(() => null);
        setError((body as { error?: string } | null)?.error || `Save failed (HTTP ${res.status})`);
      }
    } catch {
      setError("Network error — could not save.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/tools/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_type: "http", config: buildConfig() }),
      });
      if (res.ok) {
        setTestResult(await res.json());
      } else {
        setTestResult({ success: false, message: `Test failed (HTTP ${res.status})` });
      }
    } catch {
      setTestResult({ success: false, message: "Network error — could not reach the server." });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    try {
      const res = await fetch(`/api/agents/${agentId}/tools/${existing.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onSaved();
      } else {
        setError(`Delete failed (HTTP ${res.status})`);
        setConfirmDelete(false);
      }
    } catch {
      setError("Network error — could not delete.");
      setConfirmDelete(false);
    }
  };

  return (
    <NodeModal onClose={onClose} title={isEdit ? "Edit HTTP Request Tool" : "Add HTTP Request Tool"}>
      <div className="p-5 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground -mt-3">
          Configure an API endpoint your agent can call during conversations.
        </p>

        <div className="space-y-4">
          {/* URL */}
          <div>
            <Label className="text-xs">API URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/v1/resource/{id}"
              className="mt-1 h-9 text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Use {"{"}<em>param</em>{"}"} for path parameters the AI can fill
              dynamically.
            </p>
          </div>

          {/* Method */}
          <div>
            <Label className="text-xs">HTTP Method</Label>
            <div className="flex gap-1.5 mt-1">
              {HTTP_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${method === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Auth */}
          <div>
            <Label className="text-xs">Authentication</Label>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {AUTH_TYPES.map((at) => (
                <button
                  key={at.value}
                  type="button"
                  onClick={() => setAuthType(at.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${authType === at.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {at.label}
                </button>
              ))}
            </div>

            {/* Auth fields */}
            {authType === "bearer" && (
              <div className="mt-2">
                <Input
                  type="password"
                  value={authConfig.token ?? ""}
                  onChange={(e) =>
                    setAuthConfig({ ...authConfig, token: e.target.value })
                  }
                  placeholder="Bearer token"
                  className="h-8 text-sm"
                />
              </div>
            )}

            {authType === "api_key" && (
              <div className="mt-2 space-y-2">
                <Input
                  value={authConfig.api_key_name ?? ""}
                  onChange={(e) =>
                    setAuthConfig({
                      ...authConfig,
                      api_key_name: e.target.value,
                    })
                  }
                  placeholder="Header/param name (e.g. X-API-Key)"
                  className="h-8 text-sm"
                />
                <Input
                  type="password"
                  value={authConfig.api_key_value ?? ""}
                  onChange={(e) =>
                    setAuthConfig({
                      ...authConfig,
                      api_key_value: e.target.value,
                    })
                  }
                  placeholder="API key value"
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  {(["header", "query"] as const).map((placement) => (
                    <button
                      key={placement}
                      type="button"
                      onClick={() =>
                        setAuthConfig({
                          ...authConfig,
                          api_key_in: placement,
                        })
                      }
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${(authConfig.api_key_in ?? "header") === placement
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/30 text-muted-foreground"
                        }`}
                    >
                      In {placement}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {authType === "basic" && (
              <div className="mt-2 space-y-2">
                <Input
                  value={authConfig.username ?? ""}
                  onChange={(e) =>
                    setAuthConfig({ ...authConfig, username: e.target.value })
                  }
                  placeholder="Username"
                  className="h-8 text-sm"
                />
                <Input
                  type="password"
                  value={authConfig.password ?? ""}
                  onChange={(e) =>
                    setAuthConfig({ ...authConfig, password: e.target.value })
                  }
                  placeholder="Password"
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>

          {/* Static Headers */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Headers (optional)</Label>
              <button
                type="button"
                onClick={() =>
                  setHeaders([...headers, { key: "", value: "" }])
                }
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {headers.map((h, i) => (
              <div key={i} className="flex gap-1.5 mt-1.5">
                <Input
                  value={h.key}
                  onChange={(e) => {
                    const updated = [...headers];
                    updated[i].key = e.target.value;
                    setHeaders(updated);
                  }}
                  placeholder="Header name"
                  className="h-8 text-sm flex-1"
                />
                <Input
                  value={h.value}
                  onChange={(e) => {
                    const updated = [...headers];
                    updated[i].value = e.target.value;
                    setHeaders(updated);
                  }}
                  placeholder="Value"
                  className="h-8 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => setHeaders(headers.filter((_, j) => j !== i))}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Advanced */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            Advanced
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-2 border-l-2 border-border/40">
              <div>
                <Label className="text-xs">Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Description (AI-facing)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Response Path</Label>
                <Input
                  value={responsePath}
                  onChange={(e) => setResponsePath(e.target.value)}
                  placeholder="data.results"
                  className="mt-1 h-8 text-sm font-mono"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Dot-notation to extract specific data from the response.
                </p>
              </div>
              {method !== "GET" && (
                <div>
                  <Label className="text-xs">Body Description</Label>
                  <Textarea
                    value={bodyDescription}
                    onChange={(e) => setBodyDescription(e.target.value)}
                    placeholder="Describe what data the AI should send..."
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {/* Test */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !url.trim()}
              className="gap-1.5 text-xs"
            >
              {testing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : null}
              Test Connection
            </Button>
            {testResult && (
              <div className="flex items-center gap-1 text-xs">
                {testResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                )}
                <span
                  className={
                    testResult.success
                      ? "text-emerald-400"
                      : "text-destructive"
                  }
                >
                  {testResult.message}
                </span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div>
              {isEdit &&
                (confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleDelete}
                      className="text-xs h-7"
                    >
                      Confirm Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs h-7 text-destructive hover:text-destructive gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!canSave || saving}
                className="text-xs h-8"
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : null}
                {isEdit ? "Save Changes" : "Add Tool"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </NodeModal>
  );
}
