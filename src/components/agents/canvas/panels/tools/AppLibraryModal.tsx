"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  Check,
  Loader2,
  ExternalLink,
  ArrowLeft,
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

interface ComposioApp {
  toolkit: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  authSchemes?: string[];
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

  const handleAppClick = (app: ComposioApp) => {
    if (isConnected(app.toolkit)) {
      const conn = getConnection(app.toolkit);
      if (conn) {
        onSelectApp(app, conn);
      }
    } else if (app.noAuth) {
      // No-auth apps don't need OAuth — connect directly
      void connect(app.toolkit, app.name, app.logo ?? app.icon);
    } else {
      void connect(app.toolkit, app.name, app.logo ?? app.icon);
    }
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
                      <div className="mt-2 flex items-center gap-2">
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
                        ) : app.noAuth ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                            No auth needed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                            <ExternalLink className="w-3 h-3" />
                            Connect
                          </span>
                        )}
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
