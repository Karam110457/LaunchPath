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

  // Settings
  if (pathname.startsWith("/dashboard/settings")) {
    crumbs.push({
      label: "Settings",
      href: "/dashboard/settings",
      isActive: true,
    });
    return crumbs;
  }

  // Client pages
  if (pathname.startsWith("/dashboard/clients")) {
    crumbs.push({
      label: "Clients",
      href: "/dashboard/clients",
      isActive: pathname === "/dashboard/clients",
    });

    if (pathname === "/dashboard/clients/new") {
      crumbs.push({
        label: "New Client",
        href: "/dashboard/clients/new",
        isActive: true,
      });
    }

    const clientMatch = pathname.match(/^\/dashboard\/clients\/([^/]+)/);
    if (clientMatch && clientMatch[1] !== "new") {
      crumbs.push({
        label: "Client",
        href: `/dashboard/clients/${clientMatch[1]}`,
        isActive: true,
      });
    }

    return crumbs;
  }

  // Campaign pages
  if (pathname.startsWith("/dashboard/campaigns")) {
    crumbs.push({
      label: "Campaigns",
      href: "/dashboard/campaigns",
      isActive: pathname === "/dashboard/campaigns",
    });

    const campaignMatch = pathname.match(/^\/dashboard\/campaigns\/([^/]+)$/);
    if (campaignMatch) {
      crumbs.push({
        label: "Campaign",
        href: pathname,
        isActive: true,
      });
    }

    return crumbs;
  }

  // Agent pages
  if (pathname.startsWith("/dashboard/agents")) {
    crumbs.push({
      label: "Agents",
      href: "/dashboard/agents",
      isActive: pathname === "/dashboard/agents",
    });

    if (pathname === "/dashboard/agents/new") {
      crumbs.push({
        label: "New Agent",
        href: "/dashboard/agents/new",
        isActive: true,
      });
    }

    const agentMatch = pathname.match(/^\/dashboard\/agents\/([^/]+)$/);
    if (agentMatch && agentMatch[1] !== "new") {
      crumbs.push({
        label: "Agent",
        href: pathname,
        isActive: true,
      });
    }

    return crumbs;
  }

  // Business pages: /dashboard/systems/[id] or /dashboard/systems/[id]/chat
  const systemMatch = pathname.match(
    /^\/dashboard\/systems\/([^/]+)(\/(.+))?$/
  );
  if (systemMatch) {
    const systemId = systemMatch[1];
    const subPage = systemMatch[3]; // "chat" or undefined
    const system = systems.find((s) => s.id === systemId);
    const systemName = system?.name ?? "Business";

    // Only show breadcrumb on the overview page, not on chat
    // (chat has sidebar nav, breadcrumb is redundant there)
    if (!subPage) {
      crumbs.push({
        label: systemName,
        href: `/dashboard/systems/${systemId}`,
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

  // Hide the header entirely when there are no breadcrumbs (chat, builder)
  if (breadcrumbs.length === 0) return null;

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
