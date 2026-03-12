"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  Check,
  Loader2,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  useComposioConnections,
  type ComposioConnection,
} from "@/hooks/useComposioConnections";
import { OAuthCredentialsForm } from "./OAuthCredentialsForm";

interface ComposioApp {
  toolkit: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  authSchemes?: string[];
  composioManagedAuthSchemes?: string[];
  noAuth?: boolean;
  toolsCount?: number;
  logo?: string | null;
}

interface AppLibraryModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when user wants to add a connected app to an agent */
  onSelectApp: (app: ComposioApp, connection: ComposioConnection) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Apps",
  email: "Email",
  crm: "CRM",
  communication: "Communication",
  scheduling: "Scheduling",
  productivity: "Productivity",
  "project-management": "Project Management",
  social: "Social Media",
  "developer-tools": "Developer Tools",
  finance: "Finance",
  "customer-support": "Customer Support",
  storage: "File Storage",
  ecommerce: "E-commerce",
  marketing: "Marketing",
  analytics: "Analytics",
  automation: "Automation",
  other: "Other",
};

export function AppLibraryModal({
  open,
  onClose,
  onSelectApp,
}: AppLibraryModalProps) {
  const [apps, setApps] = useState<ComposioApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const {
    connections,
    loading: connectionsLoading,
    connecting,
    connectError,
    clearConnectError,
    connect,
    isConnected,
    getConnection,
  } = useComposioConnections();

  // Fetch available apps
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setAppsLoading(true);
      try {
        const res = await fetch("/api/composio/apps");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { apps: ComposioApp[] };
          setApps(data.apps);
        }
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setAppsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Filter apps
  const filteredApps = useMemo(() => {
    let result = apps;

    if (activeCategory !== "all") {
      result = result.filter((a) => a.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.toolkit.toLowerCase().includes(q)
      );
    }

    return result;
  }, [apps, activeCategory, search]);

  // Get categories that have apps
  const availableCategories = useMemo(() => {
    const cats = new Set(apps.map((a) => a.category));
    return ["all", ...Array.from(cats)];
  }, [apps]);

  /** Schemes that don't require developer app registration — user just enters a key/token. */
  const SIMPLE_SCHEMES = new Set(["API_KEY", "BEARER_TOKEN", "BASIC", "BASIC_WITH_JWT", "GOOGLE_SERVICE_ACCOUNT"]);

  /**
   * Categorize an app's auth situation for UI display.
   * - "managed": Composio handles auth (one-click connect, e.g. Google, GitHub)
   * - "simple": Has a simple scheme like API_KEY that just needs user input
   * - "devSetup": Only OAuth2 schemes that need developer app registration
   * - "noAuth": No authentication required
   */
  const getAuthCategory = (app: ComposioApp): "managed" | "simple" | "devSetup" | "noAuth" => {
    if (app.noAuth) return "noAuth";
    const managed = app.composioManagedAuthSchemes ?? [];
    if (managed.length > 0) return "managed";
    const schemes = app.authSchemes ?? [];
    if (schemes.length === 0) return "managed"; // no info, assume connectable
    const hasSimple = schemes.some((s) => SIMPLE_SCHEMES.has(s.toUpperCase()));
    const hasOAuth = schemes.some((s) => s.toUpperCase() === "OAUTH2" || s.toUpperCase() === "OAUTH1");
    // Apps with BOTH OAuth and a simple scheme (e.g. Shopify: OAuth2 + API_KEY)
    // should show a picker so the user can choose their preferred method.
    if (hasOAuth && hasSimple) return "devSetup";
    if (hasSimple) return "simple";
    return "devSetup";
  };

  /**
   * Get available simple auth schemes for an app (API_KEY, BEARER_TOKEN, etc.)
   */
  const getSimpleSchemes = (app: ComposioApp): string[] => {
    return (app.authSchemes ?? []).filter((s) => SIMPLE_SCHEMES.has(s.toUpperCase()));
  };

  /**
   * Get a human-readable label for an auth scheme.
   */
  const schemeLabel = (scheme: string): string => {
    const labels: Record<string, string> = {
      API_KEY: "API Key",
      BEARER_TOKEN: "Bearer Token",
      BASIC: "Basic Auth",
      BASIC_WITH_JWT: "Basic Auth",
      GOOGLE_SERVICE_ACCOUNT: "Service Account",
      OAUTH2: "OAuth",
      OAUTH1: "OAuth",
    };
    return labels[scheme.toUpperCase()] ?? scheme;
  };

  // Track which app is showing the auth method picker
  const [authPickerApp, setAuthPickerApp] = useState<string | null>(null);

  const handleAppClick = (app: ComposioApp) => {
    clearConnectError();
    if (isConnected(app.toolkit)) {
      const conn = getConnection(app.toolkit);
      if (conn) {
        onSelectApp(app, conn);
      }
      return;
    }

    const category = getAuthCategory(app);

    if (category === "devSetup") {
      // Check if there are also simple schemes available alongside OAuth
      const simpleSchemes = getSimpleSchemes(app);
      if (simpleSchemes.length > 0) {
        // Show auth method picker — user can choose between OAuth (needs dev setup) and API Key
        setAuthPickerApp(app.toolkit);
        return;
      }
      // Only OAuth with no simple alternatives — try anyway, backend will return helpful error
      setCredentialsContext({
        toolkit: app.toolkit,
        toolkitName: app.name,
        toolkitIcon: app.logo ?? app.icon,
        authScheme: "OAUTH2",
      });
      void connect(app.toolkit, app.name, app.logo ?? app.icon, "OAUTH2");
    } else if (category === "simple") {
      // Connect using the simple scheme (e.g. API_KEY).
      // Backend will return CREDENTIALS_REQUIRED with the fields the user needs to fill.
      const simpleSchemes = getSimpleSchemes(app);
      setCredentialsContext({
        toolkit: app.toolkit,
        toolkitName: app.name,
        toolkitIcon: app.logo ?? app.icon,
        authScheme: simpleSchemes[0],
      });
      void connect(app.toolkit, app.name, app.logo ?? app.icon, simpleSchemes[0]);
    } else {
      // Managed or noAuth — connect normally
      void connect(app.toolkit, app.name, app.logo ?? app.icon);
    }
  };

  const handleSchemeSelect = (app: ComposioApp, scheme: string) => {
    setAuthPickerApp(null);
    void connect(app.toolkit, app.name, app.logo ?? app.icon, scheme);
  };

  // Track the app/scheme that triggered a CUSTOM_CREDENTIALS_REQUIRED error
  // so we know what to retry with when the user submits the form.
  const [credentialsContext, setCredentialsContext] = useState<{
    toolkit: string;
    toolkitName: string;
    toolkitIcon: string;
    authScheme: string;
  } | null>(null);

  // When connectError changes, capture context for the credentials form.
  // CREDENTIALS_REQUIRED = simple scheme (API_KEY/BEARER_TOKEN/BASIC) needs user credentials.
  // CUSTOM_CREDENTIALS_REQUIRED = OAuth scheme needs developer credentials.
  const showCredentialsForm =
    (connectError?.code === "CREDENTIALS_REQUIRED" || connectError?.code === "CUSTOM_CREDENTIALS_REQUIRED") &&
    (connectError.requiredFields ?? []).length > 0;

  const handleCredentialsSubmit = (credentials: Record<string, string>) => {
    if (!credentialsContext) return;
    const { toolkit, toolkitName, toolkitIcon, authScheme } = credentialsContext;
    void connect(toolkit, toolkitName, toolkitIcon, authScheme, credentials);
  };

  const handleCredentialsCancel = () => {
    clearConnectError();
    setCredentialsContext(null);
  };

  // Wrap handleSchemeSelect and handleAppClick to track context for credential forms
  const originalHandleSchemeSelect = handleSchemeSelect;
  const wrappedHandleSchemeSelect = (app: ComposioApp, scheme: string) => {
    setCredentialsContext({
      toolkit: app.toolkit,
      toolkitName: app.name,
      toolkitIcon: app.logo ?? app.icon,
      authScheme: scheme,
    });
    originalHandleSchemeSelect(app, scheme);
  };

  const isLoading = appsLoading || connectionsLoading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <DialogTitle>App Library</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Connect apps to give your agent superpowers.{" "}
                {apps.length > 0 && (
                  <span className="text-muted-foreground/70">
                    {apps.length} apps available
                  </span>
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search apps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-6 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                activeCategory === cat
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
              )}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Custom credentials form — shown when an app needs credentials */}
        {showCredentialsForm && connectError && credentialsContext && (
          <div className="mx-6 mb-3 px-4 py-4 rounded-lg bg-muted/30 border border-border/50">
            <OAuthCredentialsForm
              key={`${credentialsContext.toolkit}-${credentialsContext.authScheme}`}
              toolkitName={credentialsContext.toolkitName}
              authScheme={connectError.authScheme ?? credentialsContext.authScheme}
              requiredFields={connectError.requiredFields!}
              submitting={connecting === credentialsContext.toolkit}
              onSubmit={handleCredentialsSubmit}
              onCancel={handleCredentialsCancel}
            />
          </div>
        )}

        {/* Connection error banner — generic errors (not credentials form) */}
        {connectError && !showCredentialsForm && (
          <div className="mx-6 mb-3 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90">
              Failed to connect <span className="font-medium">{connectError.toolkit}</span>:{" "}
              {connectError.message}
            </div>
          </div>
        )}

        {/* App grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">
                {search
                  ? `No apps matching "${search}"`
                  : "No apps in this category"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredApps.map((app) => {
                const connected = isConnected(app.toolkit);
                const isConnecting = connecting === app.toolkit;

                return (
                  <button
                    key={app.toolkit}
                    onClick={() => handleAppClick(app)}
                    disabled={isConnecting}
                    className={cn(
                      "text-left rounded-xl border p-3.5 flex items-start gap-3 transition-all group",
                      connected
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "border-border/50 hover:border-primary/40 hover:bg-primary/5",
                      isConnecting && "opacity-70 pointer-events-none"
                    )}
                  >
                    {/* App icon */}
                    <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                      {app.logo && app.logo.startsWith("http") ? (
                        <img
                          src={app.logo}
                          alt={app.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                            (e.target as HTMLImageElement).parentElement!.textContent = app.name.charAt(0);
                          }}
                        />
                      ) : (
                        <span className="text-base leading-none font-medium text-muted-foreground">
                          {app.icon?.length <= 2 ? app.icon : app.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground truncate">
                          {app.name}
                        </span>
                        {connected && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {app.description}
                      </p>

                      {/* Action label */}
                      <div className="mt-2 flex flex-col gap-1.5">
                        {isConnecting ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Connecting...
                          </span>
                        ) : connected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                            <Check className="w-3 h-3" />
                            Connected — click to add
                          </span>
                        ) : authPickerApp === app.toolkit ? (
                          /* Auth method picker for multi-scheme apps */
                          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-muted-foreground mb-0.5">
                              Choose auth method:
                            </span>
                            {getSimpleSchemes(app).map((scheme) => (
                              <button
                                key={scheme}
                                onClick={(e) => { e.stopPropagation(); wrappedHandleSchemeSelect(app, scheme); }}
                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                              >
                                <KeyRound className="w-3 h-3" />
                                Connect with {schemeLabel(scheme)}
                              </button>
                            ))}
                            {(app.authSchemes ?? []).some((s) => s.toUpperCase() === "OAUTH2") && (
                              <button
                                onClick={(e) => { e.stopPropagation(); wrappedHandleSchemeSelect(app, "OAUTH2"); }}
                                className="inline-flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-400 font-medium transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Connect with OAuth (dev setup)
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setAuthPickerApp(null); }}
                              className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors mt-0.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (() => {
                          const category = getAuthCategory(app);
                          if (category === "noAuth") {
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                                No auth needed
                              </span>
                            );
                          }
                          if (category === "simple") {
                            const schemes = getSimpleSchemes(app);
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                                <KeyRound className="w-3 h-3" />
                                Connect with {schemeLabel(schemes[0])}
                              </span>
                            );
                          }
                          if (category === "devSetup") {
                            const hasSimple = getSimpleSchemes(app).length > 0;
                            if (hasSimple) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                                  <KeyRound className="w-3 h-3" />
                                  Multiple auth options
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/80">
                                <KeyRound className="w-3 h-3" />
                                Requires developer setup
                              </span>
                            );
                          }
                          // managed
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                              <ExternalLink className="w-3 h-3" />
                              Connect
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
