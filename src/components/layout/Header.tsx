"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import type { SidebarSystem } from "@/lib/dashboard/sidebar-data";

interface Breadcrumb {
  label: string;
  href: string;
  isActive: boolean;
}

function buildBreadcrumbs(
  pathname: string,
  systems: SidebarSystem[]
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [];

  // Always start with Overview
  crumbs.push({
    label: "Overview",
    href: "/dashboard",
    isActive: pathname === "/dashboard",
  });

  if (pathname === "/dashboard") return crumbs;

  // Settings
  if (pathname.startsWith("/dashboard/settings")) {
    crumbs.push({
      label: "Settings",
      href: "/dashboard/settings",
      isActive: true,
    });
    return crumbs;
  }

  // System pages: /dashboard/systems/[id] or /dashboard/systems/[id]/chat
  const systemMatch = pathname.match(
    /^\/dashboard\/systems\/([^/]+)(\/(.+))?$/
  );
  if (systemMatch) {
    const systemId = systemMatch[1];
    const subPage = systemMatch[3]; // "chat" or undefined
    const system = systems.find((s) => s.id === systemId);
    const systemName = system?.name ?? "System";

    crumbs.push({
      label: systemName,
      href: `/dashboard/systems/${systemId}`,
      isActive: !subPage,
    });

    if (subPage === "chat") {
      crumbs.push({
        label: "Chat",
        href: `/dashboard/systems/${systemId}/chat`,
        isActive: true,
      });
    }

    return crumbs;
  }

  return crumbs;
}

interface HeaderProps {
  systems?: SidebarSystem[];
}

export function Header({ systems = [] }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname, systems);

  return (
    <header className="sticky top-0 z-40 h-14 bg-background/80 backdrop-blur-md border-b border-border/40 flex items-center px-6 md:px-8">
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            {i > 0 && (
              <ChevronRight className="size-3 text-muted-foreground/50" />
            )}
            {crumb.isActive ? (
              <span className="font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-4" />
    </header>
  );
}
