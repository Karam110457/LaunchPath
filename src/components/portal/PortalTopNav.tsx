"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortal } from "@/contexts/PortalContext";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { suffix: "", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { suffix: "/conversations", label: "Conversations", icon: MessageSquare },
  { suffix: "/campaigns", label: "Campaigns", icon: Megaphone },
];

export function PortalTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { basePath, clientName, clientLogo, impersonating } = usePortal();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="w-full flex items-center justify-between px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Left — Client brand */}
      <div className="flex items-center gap-2">
        <Link
          href={basePath}
          className="flex items-center gap-3 h-12 px-5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:bg-muted/50 transition-colors duration-150"
        >
          {clientLogo ? (
            <img
              src={clientLogo}
              alt={clientName}
              className="size-7 rounded-lg object-cover"
            />
          ) : (
            <span className="text-base font-bold gradient-text">
              {clientName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-sm font-semibold hidden sm:inline">{clientName}</span>
        </Link>
      </div>

      {/* Center — Navigation pill */}
      <nav className="hidden md:flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
        {NAV_LINKS.map((link) => {
          const href = basePath + link.suffix;
          const isActive = link.exact
            ? pathname === href || pathname === href + "/"
            : pathname.startsWith(href);
          return (
            <Link
              key={link.suffix}
              href={href}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-[color,background-color,box-shadow] duration-150 flex items-center gap-2",
                isActive
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right — Actions pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
          <Link
            href={`${basePath}/settings`}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-150"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1 w-9 h-9 flex items-center justify-center"
            title="Toggle theme"
          >
            {mounted && (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
          </button>
        </div>
      </div>
    </div>
  );
}
