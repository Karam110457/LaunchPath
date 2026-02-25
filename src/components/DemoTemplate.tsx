"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Brain, Zap, Target, Shield, BarChart3, LineChart } from "lucide-react";

// --- ANIMATION WRAPPER ---
function FadeIn({
    children,
    delay = 0,
    direction = "up"
}: {
    children: React.ReactNode;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const translateClass =
        direction === "up" ? "translate-y-8" :
            direction === "down" ? "-translate-y-8" :
                direction === "left" ? "translate-x-8" :
                    direction === "right" ? "-translate-x-8" : "translate-y-0 translate-x-0";

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-1000 ease-out fill-mode-forwards ${isVisible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${translateClass}`
                }`}
        >
            {children}
        </div>
    );
}

// --- TYPES ---
export interface DemoConfig {
    headline?: string;
    subheadline?: string;
    benefits?: { title: string; description: string }[];
}

export default function DemoTemplate({ config }: { config?: DemoConfig }) {
    const [isHoveringCTA, setIsHoveringCTA] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-white/20 relative overflow-hidden flex flex-col">

            {/* --- BACKGROUND FX --- */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[var(--primary)]/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse [animation-duration:8s]" />
            <div className="absolute top-1/2 left-[-20%] w-[800px] h-[800px] bg-[var(--demo-cta)]/5 blur-[150px] rounded-full pointer-events-none -z-10 mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-[var(--primary)]/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            {/* Subtle Noise Texture overlay to give that premium studio feel */}
            <div
                className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay -z-10"
                style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }}
            />

            {/* --- NAVIGATION --- */}
            <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-xl bg-[#0a0a0a]/60 border-b border-white/[0.05]">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                        style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--demo-cta))" }}
                    >
                        <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white drop-shadow-sm">ScaleForce</span>
                </div>
                <button
                    className="hidden sm:inline-flex text-sm font-semibold px-6 py-2.5 rounded-full border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-zinc-300 hover:text-white"
                >
                    Book Consultation
                </button>
            </nav>

            {/* --- HERO SECTION --- */}
            <main className="relative pt-36 pb-24 md:pt-48 md:pb-32 px-6 flex-grow">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr,0.9fr] gap-16 md:gap-24 items-center">

                    {/* LEFT: HERO COPY */}
                    <div className="flex flex-col items-start text-left z-10 w-full">
                        <FadeIn>
                            <div
                                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-gradient-to-r from-white/5 to-transparent text-sm font-medium mb-8 backdrop-blur-md shadow-sm"
                                style={{ color: "var(--primary)" }}
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--demo-cta)" }}></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: "var(--demo-cta)" }}></span>
                                </span>
                                Free AI Growth Assessment
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h1 className="text-5xl sm:text-6xl md:text-[5rem] lg:text-[5.5rem] font-bold tracking-tighter leading-[1.05] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500">
                                Uncover Your<br />
                                <span style={{ color: "var(--primary)", WebkitTextFillColor: "var(--primary)" }} className="drop-shadow-sm pb-2 block">
                                    Scaling Bottleneck.
                                </span>
                            </h1>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-xl leading-relaxed font-light">
                                Take our 2-minute AI-powered growth audit to pinpoint exactly where your agency is leaking revenue, and get a tailored blueprint to fix it.
                            </p>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                                <button
                                    onMouseEnter={() => setIsHoveringCTA(true)}
                                    onMouseLeave={() => setIsHoveringCTA(false)}
                                    onClick={() => document.getElementById('demo-form')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full sm:w-auto group relative flex items-center justify-center gap-3 px-8 py-4.5 rounded-full font-bold text-white transition-all duration-300"
                                    style={{
                                        backgroundColor: "var(--demo-cta)",
                                        boxShadow: isHoveringCTA ? "0 0 40px -5px var(--demo-cta)" : "0 10px 30px -10px var(--demo-cta)",
                                        transform: isHoveringCTA ? "translateY(-2px)" : "translateY(0)"
                                    }}
                                >
                                    <span className="relative z-10 flex items-center gap-2 text-[16px]">
                                        Start Free Assessment
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                                </button>

                                <div className="flex items-center gap-4 text-sm font-medium text-zinc-400">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-zinc-800 flex items-center justify-center overflow-hidden shadow-lg">
                                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 15}&backgroundColor=transparent`} alt="avatar" className="w-[120%] h-[120%]" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-semibold">2,000+</span>
                                        <span className="text-xs">Agency Owners</span>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={400}>
                            <div className="mt-14 flex items-center gap-8 text-zinc-500 font-medium text-sm">
                                <span className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-md border border-white/5"><Shield className="w-4 h-4 text-zinc-400" /> 100% Secure</span>
                                <span className="flex items-center gap-2 bg-white/5 py-1.5 px-3 rounded-md border border-white/5"><Zap className="w-4 h-4 text-zinc-400" /> Instant Results</span>
                            </div>
                        </FadeIn>
                    </div>

                    {/* RIGHT: THE DEMO FORM / ASSESSMENT CARD */}
                    <FadeIn delay={300} direction="left">
                        <div id="demo-form" className="relative w-full max-w-[480px] mx-auto lg:mr-0 z-20 mt-10 lg:mt-0">
                            {/* Glowing aura behind the card */}
                            <div
                                className="absolute inset-x-4 -inset-y-4 rounded-[40px] blur-3xl opacity-20 mix-blend-screen animate-pulse"
                                style={{ backgroundColor: "var(--primary)" }}
                            />

                            <div className="relative p-[1.5px] rounded-[32px] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.02))" }}>
                                <div className="bg-zinc-950/80 backdrop-blur-3xl p-8 sm:p-10 rounded-[30.5px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">

                                    <div className="text-center mb-8 relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-[var(--primary)] blur-[40px] opacity-20 rounded-full" />
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 relative z-10 shadow-inner">
                                            <Brain className="w-7 h-7 text-white drop-shadow-md" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Agency Growth Audit</h3>
                                        <p className="text-sm text-zinc-400 font-medium">Complete fields to generate your blueprint.</p>
                                    </div>

                                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Alex Hormozi"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Agency Website</label>
                                            <input
                                                type="url"
                                                placeholder="https://youragency.com"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:bg-white/10 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-inner"
                                            />
                                        </div>

                                        <div className="space-y-2 relative">
                                            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Primary Growth Bottleneck</label>
                                            <select
                                                defaultValue=""
                                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-4 focus:outline-none focus:bg-white/10 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all appearance-none cursor-pointer shadow-inner"
                                            >
                                                <option value="" disabled className="text-zinc-600">Select your biggest challenge...</option>
                                                <option value="lead-gen" className="bg-[#111] text-white">Consistent Lead Generation</option>
                                                <option value="closing" className="bg-[#111] text-white">Closing / Sales Conversion</option>
                                                <option value="fulfillment" className="bg-[#111] text-white">Fulfillment & Operations</option>
                                                <option value="churn" className="bg-[#111] text-white">Client Churn & Retention</option>
                                            </select>
                                            <div className="absolute right-4 top-[38px] pointer-events-none text-zinc-400">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                className="w-full py-4.5 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--demo-cta))" }}
                                            >
                                                Analyze My Agency
                                                <Zap className="w-5 h-5 fill-current opacity-80" />
                                            </button>
                                        </div>

                                        <p className="text-[12px] text-center text-zinc-500 mt-5 px-2">
                                            100% Free. Takes less than 2 minutes.
                                        </p>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </main>

            {/* --- DIVIDER --- */}
            <div className="w-full max-w-7xl mx-auto h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* --- VALUE PROPS GRID --- */}
            <section className="relative py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <FadeIn>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6 text-white">What happens after you submit?</h2>
                            <p className="text-zinc-400 text-lg md:text-xl font-light">Our custom-trained AI analyzes your inputs and generates a $5k-value action plan tailored to your agency's exact life stage.</p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
                        <FadeIn delay={100} direction="up">
                            <div className="group bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 p-10 rounded-[32px] relative overflow-hidden h-full flex flex-col hover:-translate-y-1">
                                <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-6">
                                    <BarChart3 className="w-48 h-48" style={{ color: "var(--primary)" }} />
                                </div>
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-white/5 border border-white/10 shadow-sm"
                                    style={{ color: "var(--primary)" }}
                                >
                                    <BarChart3 className="w-7 h-7" />
                                </div>
                                <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">Gap Analysis</h4>
                                <p className="text-zinc-400 leading-relaxed text-[15px] font-light">
                                    We compare your current metrics against top performing agencies to identify massive hidden leverage points in your funnel.
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={200} direction="up">
                            <div className="group bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 p-10 rounded-[32px] relative overflow-hidden h-full flex flex-col hover:-translate-y-1">
                                <div className="absolute -top-10 -right-10 p-8 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-6">
                                    <Target className="w-48 h-48" style={{ color: "var(--demo-cta)" }} />
                                </div>
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-white/5 border border-white/10 shadow-sm"
                                    style={{ color: "var(--demo-cta)" }}
                                >
                                    <Target className="w-7 h-7" />
                                </div>
                                <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">Actionable Roadmap</h4>
                                <p className="text-zinc-400 leading-relaxed text-[15px] font-light">
                                    Stop second-guessing. Get a customized step-by-step checklist prioritized by lowest effort and highest ROI for the next 30 days.
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={300} direction="up">
                            <div className="group bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 p-10 rounded-[32px] relative overflow-hidden h-full flex flex-col hover:-translate-y-1">
                                <div className="absolute -top-10 -right-10 p-8 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-6 text-white">
                                    <LineChart className="w-48 h-48" />
                                </div>
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-white/5 border border-white/10 shadow-sm text-zinc-100">
                                    <LineChart className="w-7 h-7" />
                                </div>
                                <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">Revenue Forecast</h4>
                                <p className="text-zinc-400 leading-relaxed text-[15px] font-light">
                                    See exactly how much MRR you are leaving on the table, and accurately model your projected growth curve once bottlenecks are solved.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="relative py-12 border-t border-white/[0.05] bg-black/50 mt-auto backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--demo-cta))" }}
                        >
                            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="font-bold tracking-tight text-white text-[15px]">ScaleForce</span>
                    </div>
                    <div className="flex items-center gap-8 text-[13px] text-zinc-500 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                    <p className="text-[13px] text-zinc-600 font-medium">
                        © {new Date().getFullYear()} ScaleForce Analytics. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
