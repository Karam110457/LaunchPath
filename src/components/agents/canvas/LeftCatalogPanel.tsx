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
        { type: "mcp", name: "MCP Server", Icon: Plug, color: "text-zinc-600" },
    ];

export function LeftCatalogPanel() {
    const [apps, setApps] = useState<ComposioApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("AI & Apps");

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
    };

    return (
        <div className="absolute top-6 left-6 bottom-6 w-[280px] z-20 flex flex-col bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden">

            {/* Header */}
            <div className="px-5 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-zinc-800" />
                        <span className="font-semibold text-zinc-900 text-sm">Tools</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                        <button className="hover:text-zinc-600 transition-colors">
                            <span className="text-sm font-bold tracking-widest leading-none">...</span>
                        </button>
                        <button className="hover:text-zinc-600 transition-colors ml-1">
                            <Sidebar className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute stroke-[3px] left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/50 border border-zinc-200/60 rounded-xl py-2 pl-9 pr-4 text-xs shadow-sm shadow-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between mt-5 border-b border-zinc-200/50">
                    {["All", "Controls", "AI & Apps", "Custom"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "relative pb-2 text-[10px] font-semibold transition-colors",
                                activeTab === tab
                                    ? "text-zinc-900"
                                    : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
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
                                        className="group flex flex-col items-center justify-center p-3 h-[90px] bg-white/40 border border-white/50 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-white/80 hover:shadow-sm transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-white shadow-sm border border-zinc-100">
                                            <t.Icon className={cn("w-4 h-4", t.color)} />
                                        </div>
                                        <span className="text-[10px] font-semibold text-zinc-700 text-center tracking-tight leading-none group-hover:text-zinc-900">
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
                                        className="group flex flex-col items-center justify-center p-3 h-[90px] bg-white/40 border border-white/50 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-white/80 hover:shadow-sm transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2 overflow-hidden bg-white shadow-sm border border-zinc-100 p-1">
                                            {app.logo && app.logo.startsWith("http") ? (
                                                <img src={app.logo} alt={app.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xs font-bold text-zinc-500">{app.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-semibold text-zinc-700 text-center tracking-tight leading-none group-hover:text-zinc-900 line-clamp-2">
                                            {app.name}
                                        </span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Empty State */}
                        {filteredApps.length === 0 && filteredCustom.length === 0 && (
                            <div className="col-span-2 text-center py-8">
                                <span className="text-xs text-zinc-400">No tools found matching your search.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
}
