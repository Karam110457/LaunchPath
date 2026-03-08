"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Moon, Sun, Settings, Bell, LayoutDashboard, Bot } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Agents", href: "/dashboard/agents", icon: Bot },
];

export function AgentsTopNav() {
    const pathname = usePathname();
    const [isDark, setIsDark] = useState(true);

    // Initialize theme state based on DOM on mount
    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        const isNowDark = !isDark;
        setIsDark(isNowDark);
        if (isNowDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    return (
        <div className="w-full flex items-center justify-between px-6 py-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Left Setup (Logo) */}
            <div className="flex items-center gap-2">
                <Link
                    href="/dashboard"
                    className="flex items-center h-12 px-6 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:bg-muted/50 transition-colors"
                >
                    <Logo className="text-xl" />
                </Link>
            </div>

            {/* Center Setup (Navigation Pill) */}
            <nav className="hidden md:flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
                {NAV_LINKS.map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
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

            {/* Right Setup (Actions) */}
            <div className="flex items-center gap-2">
                <div className="flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </Link>
                    <button
                        type="button"
                        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                        <Bell className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ml-1"
                        title="Toggle theme"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
