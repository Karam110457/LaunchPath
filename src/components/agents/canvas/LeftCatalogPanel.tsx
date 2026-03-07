"use client";

import { Search, LayoutGrid, Sidebar } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_TOOLS = [
    { name: "ChatGPT", icon: "/icons/chatgpt.svg", hasCustomIcon: false },
    { name: "Gemini", icon: "/icons/gemini.svg", hasCustomIcon: false },
    { name: "Grok", icon: "/icons/grok.svg", hasCustomIcon: false },
    { name: "Perplexity", icon: "/icons/perplexity.svg", hasCustomIcon: false },
    { name: "Google Drive", icon: "/icons/drive.svg", hasCustomIcon: false },
    { name: "Google Sheets", icon: "/icons/sheets.svg", hasCustomIcon: false },
    { name: "Google Slides", icon: "/icons/slides.svg", hasCustomIcon: false },
    { name: "Google Docs", icon: "/icons/docs.svg", hasCustomIcon: false },
    { name: "Slack", icon: "/icons/slack.svg", hasCustomIcon: false },
    { name: "Notion", icon: "/icons/notion.svg", hasCustomIcon: false },
    { name: "LinkedIn", icon: "/icons/linkedin.svg", hasCustomIcon: false },
    { name: "Instagram", icon: "/icons/instagram.svg", hasCustomIcon: false },
];

export function LeftCatalogPanel() {
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
                        className="w-full bg-white/50 border border-zinc-200/60 rounded-xl py-2 pl-9 pr-4 text-xs shadow-sm shadow-black/5 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between mt-5 border-b border-zinc-200/50">
                    {["All", "Controls", "AI & Apps", "Custom"].map((tab, i) => (
                        <button
                            key={tab}
                            className={cn(
                                "relative pb-2 text-[10px] font-semibold transition-colors",
                                tab === "AI & Apps"
                                    ? "text-zinc-900"
                                    : "text-zinc-400 hover:text-zinc-600"
                            )}
                        >
                            {tab}
                            {tab === "AI & Apps" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3">
                    {MOCK_TOOLS.map((tool, idx) => (
                        <div
                            key={idx}
                            className="group flex flex-col items-center justify-center p-3 h-[90px] bg-white/40 border border-white/50 rounded-2xl cursor-pointer hover:bg-white/80 hover:shadow-sm transition-all"
                        >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                                {/* Fallback to simple letter if icon not found, normally you'd use the proper img */}
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
                                    {tool.name.charAt(0)}
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-700 text-center tracking-tight leading-none group-hover:text-zinc-900">
                                {tool.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
