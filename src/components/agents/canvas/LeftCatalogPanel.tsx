"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, LayoutGrid, Sidebar, Loader2, Webhook, Globe, Users, Plug, Database, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolType } from "@/lib/tools/types";

interface ComposioApp {
    toolkit: string;
    name: string;
    icon: string;
    category: string;
    description: string;
    logo?: string | null;
}

const CUSTOM_TOOLS: {
    type: string;
    name: string;
    Icon: LucideIcon;
    color: string;
}[] = [
        { type: "knowledge", name: "Knowledge Base", Icon: Database, color: "text-violet-500" },
        { type: "webhook", name: "Webhook", Icon: Webhook, color: "text-emerald-500" },
        { type: "http", name: "HTTP Request", Icon: Globe, color: "text-blue-500" },
        { type: "subagent", name: "Sub-Agent", Icon: Users, color: "text-amber-500" },
        { type: "mcp", name: "MCP Server", Icon: Plug, color: "text-neutral-600" },
    ];

export function LeftCatalogPanel() {
    const [apps, setApps] = useState<ComposioApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("AI & Apps");

    const [isMinimized, setIsMinimized] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const res = await fetch("/api/composio/apps");
                if (res.ok && !cancelled) {
                    const data = (await res.json()) as { apps: ComposioApp[] };
                    setApps(data.apps);
                }
            } catch {
                // quiet fail
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void load();
        return () => { cancelled = true; };
    }, []);

    const filteredApps = useMemo(() => {
        if (!search.trim()) return apps;
        const q = search.toLowerCase().trim();
        return apps.filter(a => a.name.toLowerCase().includes(q) || a.toolkit.toLowerCase().includes(q));
    }, [apps, search]);

    const filteredCustom = useMemo(() => {
        if (!search.trim()) return CUSTOM_TOOLS;
        const q = search.toLowerCase().trim();
        return CUSTOM_TOOLS.filter(t => t.name.toLowerCase().includes(q));
    }, [search]);

    // Handle Drag Start
    const onDragStart = (e: React.DragEvent, type: string, payload: any = {}) => {
        e.dataTransfer.setData("application/reactflow", JSON.stringify({ type, ...payload }));
        e.dataTransfer.effectAllowed = "copy";
        
        // Attempt to find the inner icon container to use as the drag image
        // so we drag only the "node" and not the whole card
        const target = e.currentTarget as HTMLElement;
        const iconElement = target.querySelector('.drag-image-target');
        if (iconElement) {
            e.dataTransfer.setDragImage(iconElement as Element, 28, 28);
        }
    };

    if (isMinimized) {
        return (
            <div className="absolute top-6 left-6 z-20 flex items-center justify-center w-12 h-12 bg-white/70 canvas-dark:bg-[#1C1C1C]/70 backdrop-blur-2xl border border-white/60 canvas-dark:border-[#2A2A2A]/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[1rem] cursor-pointer hover:bg-white/90 canvas-dark:hover:bg-[#2A2A2A]/90 transition-all" onClick={() => setIsMinimized(false)}>
                <Sidebar className="w-5 h-5 text-neutral-600 canvas-dark:text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="absolute top-6 left-6 bottom-6 w-[280px] z-20 flex flex-col bg-white/70 canvas-dark:bg-[#141414]/90 backdrop-blur-2xl border border-white/60 canvas-dark:border-[#242424] shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-[2rem] overflow-hidden transition-all duration-300">

            {/* Header */}
            <div className="px-5 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-[#FF8C00]" />
                        <span className="font-semibold text-neutral-900 canvas-dark:text-neutral-200 text-sm">Tools</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400 canvas-dark:text-neutral-500 relative">
                        <button 
                            className="hover:text-neutral-600 canvas-dark:hover:text-neutral-300 transition-colors"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <span className="text-sm font-bold tracking-widest leading-none">...</span>
                        </button>
                        {showMenu && (
                            <div className="absolute top-full right-0 mt-2 w-36 bg-white canvas-dark:bg-[#1A1A1A] border border-neutral-200 canvas-dark:border-[#2A2A2A] shadow-lg rounded-xl py-1 z-50">
                                <button className="w-full text-left px-3 py-1.5 text-xs text-neutral-600 canvas-dark:text-neutral-400 hover:bg-neutral-50 canvas-dark:hover:bg-[#2A2A2A] hover:text-neutral-900 canvas-dark:hover:text-neutral-200 transition-colors">
                                    Refresh Tools
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-xs text-neutral-600 canvas-dark:text-neutral-400 hover:bg-neutral-50 canvas-dark:hover:bg-[#2A2A2A] hover:text-neutral-900 canvas-dark:hover:text-neutral-200 transition-colors">
                                    Settings
                                </button>
                            </div>
                        )}
                        <button 
                            className="hover:text-neutral-600 canvas-dark:hover:text-neutral-300 transition-colors ml-1"
                            onClick={() => setIsMinimized(true)}
                        >
                            <Sidebar className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute stroke-[3px] left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 canvas-dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/50 canvas-dark:bg-[#151515] border border-neutral-200/60 canvas-dark:border-[#2A2A2A] rounded-xl py-2 pl-9 pr-4 text-xs text-neutral-900 canvas-dark:text-neutral-200 shadow-sm shadow-black/5 placeholder:text-neutral-400 canvas-dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between mt-5 border-b border-neutral-200/50 canvas-dark:border-[#2A2A2A]">
                    {["All", "AI & Apps", "Custom"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "relative pb-2 text-[10px] font-semibold transition-colors",
                                activeTab === tab
                                    ? "text-neutral-900 canvas-dark:text-neutral-100"
                                    : "text-neutral-400 hover:text-neutral-600 canvas-dark:hover:text-neutral-300"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full gradient-accent-bg" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 pb-8">

                        {/* Custom Tools (always show in All or Custom tab) */}
                        {(activeTab === "All" || activeTab === "Custom") && (
                            <>
                                {filteredCustom.map((t) => (
                                    <div
                                        key={t.type}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, t.type)}
                                        className="group flex flex-col items-center justify-start pt-4 pb-2 h-[106px] bg-[#f8f9fa] canvas-dark:bg-[#1E1E1E]/80 border border-black/5 canvas-dark:border-[#2A2A2A] rounded-3xl cursor-grab active:cursor-grabbing hover:bg-white canvas-dark:hover:bg-[#252525] hover:shadow-md transition-all"
                                    >
                                        <div className="drag-image-target w-[52px] h-[52px] bg-white canvas-dark:bg-[#252525] rounded-[18px] shadow-sm border border-black/5 canvas-dark:border-[#333333] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105">
                                            <t.Icon className={cn("w-6 h-6", t.color)} />
                                        </div>
                                        <span className="text-[11px] font-semibold text-neutral-600 canvas-dark:text-neutral-400 text-center tracking-tight leading-none group-hover:text-neutral-900 canvas-dark:group-hover:text-neutral-100">
                                            {t.name}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Composio Apps (show in All or AI & Apps tab) */}
                        {(activeTab === "All" || activeTab === "AI & Apps") && (
                            <>
                                {filteredApps.map((app) => (
                                    <div
                                        key={app.toolkit}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, "composio", {
                                            toolkit: app.toolkit,
                                            name: app.name,
                                            icon: app.logo ?? app.icon
                                        })}
                                        className="group flex flex-col items-center justify-start pt-4 pb-2 h-[106px] bg-[#f8f9fa] canvas-dark:bg-[#1E1E1E]/80 border border-black/5 canvas-dark:border-[#2A2A2A] rounded-3xl cursor-grab active:cursor-grabbing hover:bg-white canvas-dark:hover:bg-[#252525] hover:shadow-md transition-all"
                                    >
                                        <div className="drag-image-target w-[52px] h-[52px] bg-white canvas-dark:bg-[#252525] rounded-[18px] shadow-sm border border-black/5 canvas-dark:border-[#333333] flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 overflow-hidden p-2">
                                            {app.logo && app.logo.startsWith("http") ? (
                                                <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-lg font-bold text-neutral-500 canvas-dark:text-neutral-400">{app.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-semibold text-neutral-600 canvas-dark:text-neutral-400 text-center tracking-tight leading-none group-hover:text-neutral-900 canvas-dark:group-hover:text-neutral-100 line-clamp-2 px-1">
                                            {app.name}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Empty State */}
                        {filteredApps.length === 0 && filteredCustom.length === 0 && (
                            <div className="col-span-2 text-center py-8">
                                <span className="text-xs text-neutral-400">No tools found matching your search.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
