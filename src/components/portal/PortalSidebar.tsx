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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PortalSidebarProps {
  clientName: string;
  clientLogo?: string | null;
}

export function PortalSidebar({ clientName, clientLogo }: PortalSidebarProps) {
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
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b border-sidebar-border/40">
        <Link href="/portal" className="flex items-center gap-2">
          <Logo className="text-lg" />
        </Link>
      </div>

      {/* Client identity */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg border border-sidebar-border/60">
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
          <span className="truncate flex-1 text-left">{clientName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-3 space-y-0.5 flex-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <nav className="px-3 space-y-0.5 pb-4">
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
