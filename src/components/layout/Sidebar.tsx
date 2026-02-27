"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSystem } from "@/app/(flows)/start/actions";
import type { SidebarSystem, SidebarUser } from "@/lib/dashboard/sidebar-data";

interface SidebarProps {
  systems?: SidebarSystem[];
  user?: SidebarUser;
}

export function Sidebar({ systems, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [isCreating, startCreating] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleNewSystem() {
    startCreating(async () => {
      await createSystem();
    });
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

      {/* Account dropdown */}
      <div className="px-3 pt-4 pb-2" ref={dropdownRef}>
        <button
          onClick={() => setAccountOpen(!accountOpen)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-sidebar-accent/50 transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-primary uppercase">
              {user?.displayName?.slice(0, 2) ?? "U"}
            </span>
          </div>
          <span className="text-sm font-medium truncate flex-1 text-left">
            {user?.displayName ?? "User"}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-sidebar-foreground/50 transition-transform",
              accountOpen && "rotate-180"
            )}
          />
        </button>

        {accountOpen && (
          <div className="mt-1 rounded-md border border-sidebar-border bg-sidebar-accent/30 overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 bg-sidebar-accent/50">
              <Building2 className="size-3.5 text-primary" />
              <span className="text-xs font-medium truncate">
                {user?.displayName ?? "User"}&apos;s Business
              </span>
            </div>
            <button
              disabled
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-sidebar-foreground/30 cursor-not-allowed"
            >
              <Plus className="size-3.5" />
              Add another business
            </button>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-1">
        {/* Overview link */}
        <nav className="space-y-1 mb-2">
          <div className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
            Dashboard
          </div>
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname === "/dashboard"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>
        </nav>

        {/* Systems list */}
        <nav className="space-y-1">
          <div className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
            Systems
          </div>
          {hasSystems ? (
            systems.map((system) => {
              const isActive = pathname.startsWith(
                `/dashboard/systems/${system.id}`
              );
              const isLive = system.status === "complete";

              return (
                <Link
                  key={system.id}
                  href={`/dashboard/systems/${system.id}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors group",
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
                </Link>
              );
            })
          ) : (
            <p className="px-3 text-xs text-sidebar-foreground/40">
              No systems yet
            </p>
          )}

          {/* New System button */}
          <button
            onClick={handleNewSystem}
            disabled={isCreating}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Creating..." : "New System"}
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom nav */}
        <nav className="space-y-1 pb-4">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              pathname.startsWith("/dashboard/settings")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      </div>
    </aside>
  );
}
