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
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSystem } from "@/app/(flows)/start/actions";
import type { SidebarSystem, SidebarUser } from "@/lib/dashboard/sidebar-data";

interface SidebarProps {
  systems?: SidebarSystem[];
  user?: SidebarUser;
  agentCount?: number;
  clientCount?: number;
}

export function Sidebar({ systems, user, agentCount, clientCount }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCreating, startCreating] = useTransition();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Derive current business from URL
  const systemMatch = pathname.match(/^\/dashboard\/systems\/([^/]+)/);
  const currentId = systemMatch?.[1] ?? null;
  const currentBusiness = systems?.find((s) => s.id === currentId) ?? null;

  // Click outside to close switcher
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(e.target as Node)
      ) {
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
    router.push(`/dashboard/systems/${id}`);
  }

  const hasSystems = systems && systems.length > 0;

  return (
    <aside className="fixed md:relative z-50 w-80 bg-background text-foreground hidden md:flex h-screen shrink-0 border-r border-border/40">
      {/* Column 1: Primary Icon Nav (w-16) */}
      <div className="w-16 flex flex-col items-center border-r border-border/40 py-4 h-full shrink-0">
        <Link href="/dashboard" className="mb-8 flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors">
          <Logo className="text-xl" />
        </Link>

        <nav className="flex flex-col items-center gap-4 flex-1">
          <Link
            href="/dashboard/agents"
            className={cn(
              "flex items-center justify-center size-10 rounded-full transition-all",
              pathname.startsWith("/dashboard/agents")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Bot className="size-5" />
          </Link>
          <Link
            href="/dashboard/clients"
            className={cn(
              "flex items-center justify-center size-10 rounded-full transition-all",
              pathname.startsWith("/dashboard/clients")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Users className="size-5" />
          </Link>
        </nav>

        <nav className="flex flex-col items-center gap-4">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center justify-center size-10 rounded-full transition-all",
              pathname.startsWith("/dashboard/settings")
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="size-5" />
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center size-10 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="size-5" />
          </button>
        </nav>
      </div>

      {/* Column 2: Contextual Drawer (w-64) */}
      <div className="flex-1 flex flex-col h-full hidden md:flex">
        {/* Header / Business Switcher */}
        <div className="h-14 flex items-center px-4">
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-foreground rounded-md hover:bg-muted transition-colors"
          >
            <span className="truncate max-w-[140px]">
              {currentBusiness ? currentBusiness.name : "Select a business"}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                switcherOpen && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Dropdown */}
        <div className="relative z-50 mx-4">
          {switcherOpen && (
            <div className="absolute left-0 top-0 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg py-1 max-h-64 overflow-y-auto">
              {hasSystems ? (
                systems.map((system) => {
                  const isActive = system.id === currentId;
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

        {/* Contextual navigation */}
        <div className="px-3 pt-4 space-y-6 overflow-y-auto flex-1">
          {/* General section (if no business) or secondary info */}
          {!currentBusiness && (
            <div className="px-2">
              <p className="text-sm font-medium text-muted-foreground mb-2 px-1">Overview</p>
              <div className="space-y-1">
                <Link
                  href="/dashboard/agents"
                  className={cn(
                    "flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-all font-medium",
                    pathname.startsWith("/dashboard/agents")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Bot className="size-4" />
                  Agents
                  {agentCount != null && agentCount > 0 && (
                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-md">
                      {agentCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/dashboard/clients"
                  className={cn(
                    "flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-all font-medium",
                    pathname.startsWith("/dashboard/clients")
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Users className="size-4" />
                  Clients
                  {clientCount != null && clientCount > 0 && (
                    <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-md">
                      {clientCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          )}

          {currentBusiness && (
            <div className="px-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Workspace</p>
              <div className="space-y-1">
                <Link
                  href={`/dashboard/systems/${currentId}`}
                  className={cn(
                    "flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-all font-medium",
                    pathname === `/dashboard/systems/${currentId}`
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <LayoutDashboard className="size-4" />
                  Overview
                </Link>
                <Link
                  href={`/dashboard/systems/${currentId}/chat`}
                  className={cn(
                    "flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-all font-medium",
                    pathname === `/dashboard/systems/${currentId}/chat`
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <MessageSquare className="size-4" />
                  Chat
                </Link>
                {currentBusiness.status === "complete" && (
                  <Link
                    href={`/dashboard/systems/${currentId}/builder`}
                    className={cn(
                      "flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-all font-medium",
                      pathname === `/dashboard/systems/${currentId}/builder`
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Paintbrush className="size-4" />
                    Builder
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>


    </aside>
  );
}
