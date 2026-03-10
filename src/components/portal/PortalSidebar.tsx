"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePortal } from "@/contexts/PortalContext";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
  Plus,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

interface PortalSidebarProps {
  clientName: string;
  clientLogo?: string | null;
  role: "admin" | "viewer";
}

export function PortalSidebar({ clientName, clientLogo, role }: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { basePath } = usePortal();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { suffix: "", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { suffix: "/conversations", label: "Conversations", icon: MessageSquare },
    { suffix: "/campaigns", label: "Campaigns", icon: Megaphone },
    { suffix: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="fixed z-50 w-[280px] bg-card/40 backdrop-blur-xl text-foreground hidden md:flex flex-col h-screen shrink-0 border-r border-border/40">
      {/* Logo + Client identity */}
      <div className="px-5 pt-6 pb-4 space-y-4">
        <Link href={basePath} className="flex items-center gap-3 group">
          <div className="flex items-center justify-center size-9 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm group-hover:bg-muted/50 transition-colors duration-150">
            <Logo className="text-lg" />
          </div>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-muted/40 border border-border/30">
          {clientLogo ? (
            <img src={clientLogo} alt={clientName} className="size-8 rounded-xl object-cover border border-border/40" />
          ) : (
            <div className="size-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{clientName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{clientName}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Quick action for admins */}
      {role === "admin" && (
        <div className="px-5 pb-3">
          <Link
            href={`${basePath}/campaigns/new`}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 shadow-sm"
          >
            <Plus className="size-4" />
            New Campaign
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-3 pt-2 space-y-0.5 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Navigation</p>
        {navItems.map((item) => {
          const href = basePath + item.suffix;
          const isActive = item.exact
            ? pathname === href || pathname === href + "/"
            : pathname.startsWith(href);
          return (
            <Link
              key={item.suffix}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-150 font-medium",
                isActive
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-5 space-y-1">
        <div className="h-px bg-border/40 mx-2 mb-3" />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-150 font-medium"
        >
          {mounted && (theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />)}
          {mounted && (theme === "dark" ? "Light Mode" : "Dark Mode")}
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150 font-medium"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
