"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  ChevronDown,
  Plus,
  Settings,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  Paintbrush,
  Bot,
  Rocket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSystem } from "@/app/(flows)/start/actions";
import type { SidebarSystem } from "@/lib/dashboard/sidebar-data";

interface SidebarProps {
  systems?: SidebarSystem[];
  agentCount?: number;
  clientCount?: number;
}

export function Sidebar({ systems, agentCount, clientCount }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreating, startCreating] = useTransition();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Derive business from URL when on a business route
  const systemMatch = pathname.match(/^\/dashboard\/systems\/([^/]+)/);
  const urlBusinessId = systemMatch?.[1] ?? null;

  // Sticky business context — set by URL or switcher, never auto-cleared on navigation
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(urlBusinessId);

  // Sync from URL when navigating to a business route
  useEffect(() => {
    if (urlBusinessId) {
      setSelectedBusinessId(urlBusinessId);
    }
  }, [urlBusinessId]);

  // Guard: clear if selected business no longer exists
  const selectedBusiness = systems?.find((s) => s.id === selectedBusinessId) ?? null;
  useEffect(() => {
    if (selectedBusinessId && !selectedBusiness && systems && systems.length > 0) {
      setSelectedBusinessId(null);
    }
  }, [selectedBusinessId, selectedBusiness, systems]);

  // Click outside to close switcher
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    if (switcherOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [switcherOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleNewBusiness() {
    setSwitcherOpen(false);
    startCreating(async () => {
      await createSystem();
    });
  }

  function handleSwitchBusiness(id: string) {
    setSwitcherOpen(false);
    setSelectedBusinessId(id);
    router.push(`/dashboard/systems/${id}`);
  }

  const hasSystems = systems && systems.length > 0;

  // Nav items
  const manageItems = [
    { label: "Agents", href: "/dashboard/agents", icon: Bot, count: agentCount },
    { label: "Deploy", href: "/dashboard/clients", icon: Rocket, count: clientCount },
  ];

  const businessItems = selectedBusinessId
    ? [
        {
          label: "Overview",
          href: `/dashboard/systems/${selectedBusinessId}`,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: "Chat",
          href: `/dashboard/systems/${selectedBusinessId}/chat`,
          icon: MessageSquare,
        },
        ...(selectedBusiness?.status === "complete"
          ? [
              {
                label: "Builder",
                href: `/dashboard/systems/${selectedBusinessId}/builder`,
                icon: Paintbrush,
              },
            ]
          : []),
      ]
    : [];

  return (
    <aside className="fixed md:relative z-50 w-64 bg-background text-foreground hidden md:flex flex-col h-screen shrink-0 border-r border-border/40">
      {/* Brand header */}
      <div className="h-14 flex items-center justify-center shrink-0">
        <Link href="/dashboard" className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors">
          <Logo className="text-xl" />
        </Link>
      </div>

      {/* Business switcher */}
      <div className="px-3 pb-2 shrink-0" ref={switcherRef}>
        <button
          onClick={() => setSwitcherOpen(!switcherOpen)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            selectedBusiness
              ? "bg-muted/50 text-foreground hover:bg-muted"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {selectedBusiness && (
            <span className="relative flex size-2 shrink-0">
              {selectedBusiness.status === "complete" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  selectedBusiness.status === "complete" ? "bg-emerald-500" : "bg-yellow-500"
                )}
              />
            </span>
          )}
          <span className="truncate flex-1 text-left">
            {selectedBusiness ? selectedBusiness.name : "Select a business"}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              switcherOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {switcherOpen && (
          <div className="mt-1 w-full rounded-lg border border-border bg-popover shadow-lg py-1 max-h-64 overflow-y-auto">
            {hasSystems ? (
              systems.map((system) => {
                const isActive = system.id === selectedBusinessId;
                const isLive = system.status === "complete";
                return (
                  <button
                    key={system.id}
                    onClick={() => handleSwitchBusiness(system.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm transition-all text-left font-medium",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="relative flex size-2 shrink-0">
                      {isLive && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span
                        className={cn(
                          "relative inline-flex size-2 rounded-full",
                          isLive ? "bg-emerald-500" : "bg-yellow-500"
                        )}
                      />
                    </span>
                    <span className="truncate">{system.name}</span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-xs text-muted-foreground font-medium">
                No businesses yet
              </p>
            )}
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={handleNewBusiness}
                disabled={isCreating}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-primary hover:bg-muted transition-all text-left"
              >
                <Plus className="size-4" />
                {isCreating ? "Creating..." : "New Business"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2 space-y-6">
        {/* Manage section */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
            Manage
          </p>
          <div className="space-y-0.5">
            {manageItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all font-medium",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                  {item.count != null && item.count > 0 && (
                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-md tabular-nums">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Business section — only visible when a business is selected */}
        {selectedBusiness && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Business
            </p>
            <div className="space-y-0.5">
              {businessItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all font-medium",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-0.5 border-t border-border/40 shrink-0">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all font-medium",
            pathname.startsWith("/dashboard/settings")
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-medium text-left"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
