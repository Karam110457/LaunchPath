"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Moon, Sun, Settings, Bot, Rocket, BarChart3, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
    { label: "Agents", href: "/dashboard/agents", icon: Bot },
    { label: "Deploy", href: "/dashboard/clients", icon: Rocket },
    { label: "Usage",  href: "/dashboard/usage",   icon: BarChart3 },
];

export function TopNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <div className="w-full flex items-center justify-between px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Left Setup (Logo) */}
            <div className="flex items-center gap-2">
                <Link
                    href="/dashboard"
                    className="flex items-center h-12 px-6 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:bg-muted/50 transition-colors duration-150"
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

            {/* Right Setup (Actions) */}
            <div className="flex items-center gap-2">
                <div className="flex items-center p-1.5 rounded-full border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
                    <Link
                        href="/dashboard/settings"
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
                        onClick={toggleTheme}
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
