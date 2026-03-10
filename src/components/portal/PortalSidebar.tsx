"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PortalSidebarProps {
  clientName: string;
  clientLogo?: string | null;
  role: "admin" | "viewer";
}

export function PortalSidebar({ clientName, clientLogo, role }: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    {
      href: "/portal",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/portal/conversations",
      label: "Conversations",
      icon: MessageSquare,
    },
    {
      href: "/portal/campaigns",
      label: "Campaigns",
      icon: Megaphone,
    },
    {
      href: "/portal/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="fixed md:relative z-50 w-80 bg-background text-foreground hidden md:flex h-screen shrink-0 border-r border-border/40">
      {/* Column 1: Primary Icon Nav (w-16) */}
      <div className="w-16 flex flex-col items-center border-r border-border/40 py-4 h-full shrink-0">
        <Link href="/portal" className="mb-8 flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors">
          <Logo className="text-xl" />
        </Link>

        <div className="flex-1" />

        <nav className="flex flex-col items-center gap-4">
          <Link
            href="/portal/settings"
            className={cn(
              "flex items-center justify-center size-10 rounded-full transition-all",
              pathname.startsWith("/portal/settings")
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

        {/* Client identity */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-[14px] bg-muted/50 text-foreground transition-all">
            {clientLogo ? (
              <img
                src={clientLogo}
                alt={clientName}
                className="size-6 rounded object-cover"
              />
            ) : (
              <span className="size-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {clientName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate flex-1 text-left text-foreground">{clientName}</span>
          </div>
        </div>

        {/* Quick action for admins */}
        {role === "admin" && (
          <div className="px-4 pb-2">
            <Link
              href="/portal/campaigns/new"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-[14px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-4" />
              New Campaign
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="px-4 pt-2 space-y-1 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 mt-2">Portal</p>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm rounded-[14px] transition-all font-medium",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
