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
    <aside className="fixed md:relative z-50 w-64 border border-slate-200/60 bg-white/70 backdrop-blur-2xl rounded-[24px] text-slate-800 hidden md:flex flex-col shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] h-[calc(100vh-2rem)] overflow-hidden shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b border-slate-100">
        <Link href="/portal" className="flex items-center gap-2">
          <Logo className="text-lg" />
        </Link>
      </div>

      {/* Client identity */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-[14px] border border-slate-200/50 bg-slate-50 text-slate-900 shadow-sm">
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
          <span className="truncate flex-1 text-left text-slate-900">{clientName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-4 pt-6 space-y-1 flex-1">
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
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <nav className="px-4 space-y-1 pb-6">
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
