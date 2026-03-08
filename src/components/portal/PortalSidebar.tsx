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
    <aside className="relative z-50 w-full h-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/60 dark:border-neutral-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[24px] hidden md:flex overflow-hidden transition-all">
      {/* Column 1: Primary Icon Nav (w-16) */}
      <div className="w-16 flex flex-col items-center border-r border-border/40 py-4 h-full shrink-0">
        <Link href="/portal" className="mb-8 flex items-center justify-center size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Logo className="text-xl" />
        </Link>

        <div className="flex-1" />

        <nav className="flex flex-col items-center gap-4">
          <Link
            href="/portal/settings"
            className={cn(
              "flex items-center justify-center size-10 rounded-full transition-all",
              pathname.startsWith("/portal/settings")
                ? "bg-black/10 dark:bg-white/10 text-foreground"
                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
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
                    ? "bg-black/10 dark:bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
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
