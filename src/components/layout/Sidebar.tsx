"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  FileText,
  Package,
  Rocket,
  Wrench,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { STAGE_LABELS_SHORT } from "@/lib/constants/stages";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: STAGE_LABELS_SHORT.offer_blueprint,
    href: "/dashboard/offer",
    icon: FileText,
  },
  {
    title: STAGE_LABELS_SHORT.build_plan,
    href: "/dashboard/build",
    icon: Package,
  },
  {
    title: STAGE_LABELS_SHORT.sales_pack,
    href: "/dashboard/sell",
    icon: Rocket,
  },
  {
    title: "Tools",
    href: "/dashboard/tools",
    icon: Wrench,
  },
];

const secondaryItems = [
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
      <div className="h-14 flex items-center px-6 border-b border-sidebar-border/40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="text-lg" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-6">
        <nav className="space-y-1">
          <div className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
            Platform
          </div>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-1 mt-auto">
          <div className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
            Account
          </div>
          {secondaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-medium">US</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">User</span>
            <span className="text-xs text-sidebar-foreground/50">
              Tester Account
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
