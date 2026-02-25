"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, ShieldCheck, Zap, MessageCircle, Bot, ArrowRight, Sparkles, Building2 } from "lucide-react";

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

export interface DemoConfig {
    headline?: string;
    subheadline?: string;
    faq?: { question: string; answer: string }[];
}

export default function DemoTemplate({ config }: { config?: DemoConfig }) {
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [isHoveringForm, setIsHoveringForm] = useState(false);

    const faqs = config?.faq || [
        {
            question: "How does the WhatsApp AI Agent actually work?",
            answer: "It connects directly to your WhatsApp Business account and uses advanced conversational AI to chat with leads in real-time. It qualifies them based on your strict criteria, answers FAQs instantly, and seamlessly books calls directly into your calendar without a single human touch."
        },
        {
            question: "Do I need technical skills to set it up?",
            answer: "Zero technical skills required. We custom-build the entire workflow for you. From conversational scripts and qualification logic to CRM and calendar integrations, it's a completely done-for-you deployment. You literally just turn it on."
        },
        {
            question: "Can it integrate with my CRM?",
            answer: "Absolutely. Whether you use GoHighLevel, HubSpot, Salesforce, or anything with Zapier/Make webhooks, our AI pushes every lead data point, chat transcript, and booking event straight into your existing pipeline so your sales team never misses a beat."
        },
        {
            question: "Can the AI handle after-hours inquiries?",
            answer: "Yes. 40% of leads come in outside normal business hours. Your AI agent works 24/7/365. It responds instantly at 2 AM on a Sunday, securing the appointment before your competitor even wakes up."
        },
        {
            question: "What happens if a lead asks a complex question?",
            answer: "The AI is pre-trained on your specific business knowledge base. However, if it encounters a curveball it doesn't know how to handle, it seamlessly routes the conversation to a human team member to take over, ensuring no lead is ever left hanging."
        }
    ];

    return (
        <div className="min-h-screen bg-[#030712] text-zinc-100 font-sans selection:bg-[#10B981]/30 relative overflow-hidden flex flex-col">
            {/* Set fallback CSS variables for the template */}
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          --primary: #10B981;
          --primary-dark: #059669;
          --demo-cta: #10B981;
        }
        
        /* Subtle grid background to look technical/premium */
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }
      `}} />

            {/* --- BACKGROUND FX --- */}
            <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none -z-20" />
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[var(--primary)]/10 to-transparent pointer-events-none -z-10 blur-3xl" />
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[var(--primary)]/15 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-screen animate-pulse [animation-duration:10s]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#3b82f6]/10 blur-[150px] rounded-full pointer-events-none -z-10 mix-blend-screen" />

            {/* --- ATTENTION BANNER --- */}
            <div className="w-full bg-gradient-to-r from-[var(--primary-dark)] via-[var(--primary)] to-[var(--primary-dark)] text-black py-2.5 flex items-center justify-center gap-2 text-xs md:text-sm font-bold tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-50">
                <Sparkles className="w-4 h-4 text-black" />
                ATTENTION LOCAL BUSINESSES: AUTOMATE YOUR BOOKING FLOW TODAY
            </div>

            {/* --- HERO SECTION --- */}
            <main className="relative pt-16 pb-20 md:pt-28 md:pb-32 px-6 flex-grow z-10">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* LEFT: COPY & TRUST */}
                    <div className="w-full lg:w-[55%] flex flex-col items-center lg:items-start text-center lg:text-left">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-sm font-medium mb-6 backdrop-blur-md" style={{ color: "var(--primary)" }}>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--primary)" }}></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--primary)" }}></span>
                                </span>
                                24/7 AI Receptionist
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold tracking-tighter leading-[1.05] mb-6 text-white text-balance drop-shadow-lg">
                                Stop Chasing Leads.<br />
                                <span className="relative inline-block mt-2">
                                    Let AI Book Your
                                    <div className="absolute -bottom-2 lg:-bottom-3 left-0 right-0 h-3 lg:h-4 bg-[var(--primary)]/30 -rotate-1 rounded-sm -z-10 blur-[2px]"></div>
                                </span><br />
                                Calendar Instantly.
                            </h1>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-xl leading-relaxed text-balance">
                                Our AI Setter engages leads in real-time via WhatsApp, qualifies them against your criteria, and books appointments straight into your calendar—while you sleep.
                            </p>
                        </FadeIn>

                        {/* Social Proof Stack */}
                        <FadeIn delay={300}>
                            <div className="flex flex-col sm:flex-row items-center gap-5 mt-4 pt-8 border-t border-white/10 w-full">
                                <div className="flex -space-x-3 isolate">
                                    {[4, 7, 12, 22].map((i) => (
                                        <div key={i} className="relative w-10 h-10 rounded-full border-2 border-[#030712] overflow-hidden bg-zinc-800 shadow-md">
                                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=transparent`} alt="avatar" className="w-[120%] h-[120%] object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        </div>
                                    ))}
                                    <div className="relative w-10 h-10 rounded-full border-2 border-[#030712] overflow-hidden bg-[var(--primary)] flex items-center justify-center shadow-md">
                                        <span className="text-xs font-bold text-black tracking-tighter">+500</span>
                                    </div>
                                </div>
                                <div className="flex flex-col text-sm text-zinc-400 font-medium">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <svg key={s} className="w-4 h-4 text-[#FBBF24] fill-current drop-shadow-sm" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                    <span><strong className="text-white">Rated 4.9/5</strong> by business owners.</span>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300">
                                    <ShieldCheck className="w-4 h-4 text-[var(--primary)]" /> GDPR Compliant
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300">
                                    <Zap className="w-4 h-4 text-[var(--primary)]" /> Setup in 24 Hours
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    {/* RIGHT: DEMO FORM */}
                    <div className="w-full lg:w-[45%] relative">
                        <FadeIn delay={400} direction="left">
                            {/* Ambient Glow */}
                            <div
                                className={`absolute inset-0 bg-[var(--primary)] blur-2xl transition-opacity duration-700 rounded-3xl -z-10 ${isHoveringForm ? 'opacity-30' : 'opacity-10'}`}
                            />

                            <div
                                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] transition-transform duration-500 relative"
                                onMouseEnter={() => setIsHoveringForm(true)}
                                onMouseLeave={() => setIsHoveringForm(false)}
                                style={{
                                    transform: isHoveringForm ? 'translateY(-4px)' : 'translateY(0)',
                                    boxShadow: isHoveringForm ? '0 30px 60px -15px rgba(0,0,0,0.6)' : '0 20px 50px -12px rgba(0,0,0,0.5)'
                                }}
                            >

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5" style={{ color: "var(--primary)" }} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">See The AI In Action</h3>
                                        <p className="text-xs font-medium text-zinc-400">Fill out details to trigger a live demo.</p>
                                    </div>
                                </div>

                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider pl-0.5">First Name</label>
                                            <input
                                                type="text"
                                                placeholder="John"
                                                className="w-full bg-zinc-950/50 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider pl-0.5">Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="Doe"
                                                className="w-full bg-zinc-950/50 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider pl-0.5">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full bg-zinc-950/50 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider pl-0.5">Business Name</label>
                                        <input
                                            type="email"
                                            placeholder="Acme Corp"
                                            className="w-full bg-zinc-950/50 border border-white/10 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                        />
                                    </div>

                                    {/* Custom Checkbox */}
                                    <div className="flex items-start gap-3 mt-4 pt-2 bg-zinc-950/30 p-3 rounded-lg border border-white/5">
                                        <button
                                            type="button"
                                            className={`mt-0.5 w-[18px] h-[18px] rounded-[4px] flex shrink-0 items-center justify-center transition-all ${isConsentChecked ? "bg-[var(--primary)] border-[var(--primary)] shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-800 border-zinc-600 hover:border-zinc-500"
                                                } border`}
                                            onClick={() => setIsConsentChecked(!isConsentChecked)}
                                        >
                                            {isConsentChecked && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                                        </button>
                                        <p className="text-[11px] text-zinc-400 leading-tight">
                                            I agree to receive a live demo via WhatsApp/SMS to the number provided. Reply STOP to cancel at any time. Data simply used for the demo.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            className="group relative w-full py-4 rounded-xl font-bold flex items-center justify-center overflow-hidden transition-all duration-300"
                                            style={{ backgroundColor: "var(--primary)" }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                            <span className="relative z-10 text-black text-base flex items-center gap-2">
                                                Send My Live Demo
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </main>

            {/* --- HOW IT WORKS (REPLACING THE OLD DIVIDER) --- */}
            <section className="py-24 relative border-t border-white/5 bg-[#050B14]">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <FadeIn>
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">How The AI Setter Operates</h2>
                            <p className="text-zinc-400 text-lg">We turn your inbound messages into booked appointments on autopilot.</p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FadeIn delay={100} direction="up">
                            <div className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 hover:bg-zinc-900/80 hover:border-white/10 transition-all">
                                <div className="w-12 h-12 bg-[#3b82f6]/10 text-[#3b82f6] rounded-xl flex items-center justify-center mb-6 border border-[#3b82f6]/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">1. Instant Engagement</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    When a lead clicks your ad or messages your page, the AI responds in under 5 seconds, capturing their intent while they are hottest.
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={200} direction="up">
                            <div className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 hover:bg-zinc-900/80 hover:border-white/10 transition-all relative overflow-hidden group">
                                {/* Subtle glow behind the middle card to highlight it */}
                                <div className="absolute inset-0 bg-[var(--primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                                <div className="relative z-10 w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl flex items-center justify-center mb-6 border border-[var(--primary)]/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 relative z-10">2. Smart Qualification</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed relative z-10">
                                    The AI asks exactly what a human agent would—budget, timeline, and needs. It filters out tire-kickers so you only talk to highly qualified buyers.
                                </p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={300} direction="up">
                            <div className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 hover:bg-zinc-900/80 hover:border-white/10 transition-all">
                                <div className="w-12 h-12 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-xl flex items-center justify-center mb-6 border border-[#8b5cf6]/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                                    <CalendarClock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">3. Direct Booking</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Once qualified, the AI presents available times from your calendar and secures the appointment directly inside the chat thread seamlessly.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section className="py-24 px-6 border-t border-white/5">
                <div className="max-w-3xl mx-auto w-full">
                    <div className="text-center mb-16">
                        <FadeIn>
                            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">Frequently Asked Questions</h2>
                            <p className="text-zinc-400 text-lg">Everything you need to know about the AI Setter.</p>
                        </FadeIn>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <FadeIn key={idx} delay={50 * idx} direction="up">
                                <div
                                    className={`bg-zinc-900/50 rounded-xl border transition-all duration-300 ${openFaq === idx ? 'border-[var(--primary)]/50 shadow-[0_5px_20px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                                >
                                    <button
                                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    >
                                        <span className={`font-bold text-[16px] pr-4 transition-colors ${openFaq === idx ? 'text-white' : 'text-zinc-200'}`}>{faq.question}</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === idx ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'bg-white/5 text-zinc-400'}`}>
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                                        </div>
                                    </button>
                                    <div
                                        className={`px-6 text-zinc-400 text-[15px] leading-relaxed overflow-hidden transition-all duration-300`}
                                        style={{
                                            maxHeight: openFaq === idx ? "200px" : "0",
                                            paddingBottom: openFaq === idx ? "20px" : "0",
                                            opacity: openFaq === idx ? 1 : 0
                                        }}
                                    >
                                        <p className="pt-2 border-t border-white/5">{faq.answer}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- BOTTOM CTA --- */}
            <section className="relative py-32 px-6 border-t border-white/5 bg-[#030712] overflow-hidden">
                {/* Glow behind CTA */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <FadeIn>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-xl">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight text-balance">
                            Ready to put your booking<br className="hidden md:block" /> calendar on <span style={{ color: "var(--primary)" }}>autopilot?</span>
                        </h2>
                        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Don't lose another lead to slow response times. Test the AI for yourself right now, zero commitment.
                        </p>

                        <button
                            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full font-bold shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)]"
                            style={{ backgroundColor: "var(--primary)" }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <span className="text-black text-lg">Test The Agent Live</span>
                            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <ArrowRight className="w-4 h-4 text-black" />
                            </div>
                        </button>

                        <p className="mt-8 text-sm text-zinc-500 font-medium">Join 500+ businesses scaling with AI.</p>
                    </FadeIn>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="py-8 px-6 text-center border-t border-white/5 bg-black z-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-white" />
                        <span className="text-lg font-bold tracking-tight text-white">ClientAutomations</span>
                    </div>

                    <div className="flex gap-6 text-sm text-zinc-500 font-medium">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                    </div>

                    <p className="text-sm text-zinc-600 font-medium">
                        © {new Date().getFullYear()} All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
