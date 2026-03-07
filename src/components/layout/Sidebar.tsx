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
    <aside className="fixed md:relative z-50 w-64 border border-slate-200/60 bg-white/70 backdrop-blur-2xl rounded-[24px] text-slate-800 hidden md:flex flex-col shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] h-[calc(100vh-2rem)] overflow-hidden shrink-0">
      <div className="h-14 flex items-center px-6 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="text-lg" />
        </Link>
      </div>

      {/* Business switcher */}
      <div className="relative px-4 pt-4" ref={switcherRef}>
        <button
          onClick={() => setSwitcherOpen(!switcherOpen)}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-900 rounded-[14px] bg-slate-50 border border-slate-200/50 hover:bg-slate-100 transition-all shadow-sm"
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
            <span className="truncate flex-1 text-left text-slate-500 font-medium">
              Select a business
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-400 transition-transform",
              switcherOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown */}
        {switcherOpen && (
          <div className="absolute left-4 right-4 top-full mt-2 rounded-[16px] border border-slate-100 bg-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)] z-50 py-1.5 max-h-64 overflow-y-auto">
            {hasSystems ? (
              systems.map((system) => {
                const isActive = system.id === currentId;
                const isLive = system.status === "complete";
                return (
                  <button
                    key={system.id}
                    onClick={() => handleSwitchBusiness(system.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all text-left rounded-[12px] mx-1.5 font-medium",
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
              <p className="px-4 py-3 text-xs text-slate-400 font-medium">
                No businesses yet
              </p>
            )}
            <div className="border-t border-slate-100 mt-1 pt-1 mx-1.5">
              <button
                onClick={handleNewBusiness}
                disabled={isCreating}
                className="w-full flex items-center gap-3 px-3 py-2.5 mt-0.5 text-sm font-semibold rounded-[12px] text-emerald-600 hover:bg-emerald-50 transition-all text-left mb-0.5"
              >
                <Plus className="size-4" />
                {isCreating ? "Creating..." : "New Business"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global nav — always visible */}
      <nav className="px-4 pt-6 space-y-1">
        <Link
          href="/dashboard/agents"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm rounded-[14px] transition-all font-medium",
            pathname.startsWith("/dashboard/agents")
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Bot className="size-4" />
          Agents
          {agentCount != null && agentCount > 0 && (
            <span className={cn("ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
              pathname.startsWith("/dashboard/agents") ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {agentCount}
            </span>
          )}
        </Link>
        <Link
          href="/dashboard/clients"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm rounded-[14px] transition-all font-medium",
            pathname.startsWith("/dashboard/clients")
              ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Users className="size-4" />
          Clients
          {clientCount != null && clientCount > 0 && (
            <span className={cn("ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
              pathname.startsWith("/dashboard/clients") ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {clientCount}
            </span>
          )}
        </Link>
      </nav>

      {/* Business navigation — only when a business is selected */}
      {currentBusiness && (
        <nav className="px-4 pt-6 space-y-1">
          <Link
            href={`/dashboard/systems/${currentId}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm rounded-[14px] transition-all font-medium",
              pathname === `/dashboard/systems/${currentId}`
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <LayoutDashboard className="size-4" />
            Overview
          </Link>
          <Link
            href={`/dashboard/systems/${currentId}/chat`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm rounded-[14px] transition-all font-medium",
              pathname === `/dashboard/systems/${currentId}/chat`
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <MessageSquare className="size-4" />
            Chat
          </Link>
          {currentBusiness.status === "complete" && (
            <Link
              href={`/dashboard/systems/${currentId}/builder`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-[14px] transition-all font-medium",
                pathname === `/dashboard/systems/${currentId}/builder`
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
      <nav className="px-4 space-y-1 pb-6">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-[14px] transition-all",
            pathname.startsWith("/dashboard/settings")
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-[14px] text-slate-500 hover:bg-destructive/10 hover:text-destructive transition-all text-left"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </nav>
    </aside>
  );
}
