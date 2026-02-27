"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
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
  const [isCreating, startCreating] = useTransition();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleNewBusiness() {
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

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 flex flex-col gap-1">
        {/* Home link */}
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
          Home
        </Link>

        {/* Businesses list */}
        <div className="mt-4">
          <div className="px-3 mb-2 text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">
            Your Businesses
          </div>
          {hasSystems ? (
            <nav className="space-y-0.5">
              {systems.map((system) => {
                const isActive = pathname.startsWith(
                  `/dashboard/systems/${system.id}`
                );
                const isLive = system.status === "complete";

                return (
                  <Link
                    key={system.id}
                    href={`/dashboard/systems/${system.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
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
              })}
            </nav>
          ) : (
            <p className="px-3 py-1 text-xs text-sidebar-foreground/30">
              No businesses yet
            </p>
          )}

          {/* New Business button */}
          <button
            onClick={handleNewBusiness}
            disabled={isCreating}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 text-sm rounded-md text-primary/80 hover:bg-sidebar-accent/50 hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? "Creating..." : "New Business"}
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom nav */}
        <nav className="space-y-0.5 pb-4">
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
