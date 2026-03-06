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
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b border-sidebar-border/40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="text-lg" />
        </Link>
      </div>

      {/* Business switcher */}
      <div className="relative px-3 pt-3" ref={switcherRef}>
        <button
          onClick={() => setSwitcherOpen(!switcherOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg border border-sidebar-border/60 hover:bg-sidebar-accent/50 transition-colors"
        >
          {currentBusiness ? (
            <>
              <span className="relative flex size-2 shrink-0">
                {currentBusiness.status === "complete" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={cn(
                    "relative inline-flex size-2 rounded-full",
                    currentBusiness.status === "complete"
                      ? "bg-emerald-500"
                      : "bg-yellow-500"
                  )}
                />
              </span>
              <span className="truncate flex-1 text-left">
                {currentBusiness.name}
              </span>
            </>
          ) : (
            <span className="truncate flex-1 text-left text-sidebar-foreground/50">
              Select a business
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-sidebar-foreground/40 transition-transform",
              switcherOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {switcherOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 rounded-lg border border-sidebar-border bg-sidebar shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
            {hasSystems ? (
              systems.map((system) => {
                const isActive = system.id === currentId;
                const isLive = system.status === "complete";
                return (
                  <button
                    key={system.id}
                    onClick={() => handleSwitchBusiness(system.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
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
              <p className="px-3 py-2 text-xs text-sidebar-foreground/30">
                No businesses yet
              </p>
            )}
            <div className="border-t border-sidebar-border/40 mt-1 pt-1">
              <button
                onClick={handleNewBusiness}
                disabled={isCreating}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-primary/80 hover:bg-sidebar-accent/50 hover:text-primary transition-colors text-left"
              >
                <Plus className="size-4" />
                {isCreating ? "Creating..." : "New Business"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global nav — always visible */}
      <nav className="px-3 pt-3 space-y-0.5">
        <Link
          href="/dashboard/agents"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
            pathname.startsWith("/dashboard/agents")
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Bot className="size-4" />
          Agents
          {agentCount != null && agentCount > 0 && (
            <span className="ml-auto text-xs text-sidebar-foreground/40">
              {agentCount}
            </span>
          )}
        </Link>
        <Link
          href="/dashboard/clients"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
            pathname.startsWith("/dashboard/clients")
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Users className="size-4" />
          Clients
          {clientCount != null && clientCount > 0 && (
            <span className="ml-auto text-xs text-sidebar-foreground/40">
              {clientCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Business navigation — only when a business is selected */}
      {currentBusiness && (
        <nav className="px-3 pt-3 space-y-0.5">
          <Link
            href={`/dashboard/systems/${currentId}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
              pathname === `/dashboard/systems/${currentId}`
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <LayoutDashboard className="size-4" />
            Overview
          </Link>
          <Link
            href={`/dashboard/systems/${currentId}/chat`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
              pathname === `/dashboard/systems/${currentId}/chat`
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <MessageSquare className="size-4" />
            Chat
          </Link>
          {currentBusiness.status === "complete" && (
            <Link
              href={`/dashboard/systems/${currentId}/builder`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                pathname === `/dashboard/systems/${currentId}/builder`
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Paintbrush className="size-4" />
              Builder
            </Link>
          )}
        </nav>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom nav */}
      <nav className="px-3 space-y-0.5 pb-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors text-left"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </nav>
    </aside>
  );
}
