"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, ArrowRight, MessageSquare, CalendarCheck, TrendingUp, CheckCircle2, PhoneCall, Zap } from "lucide-react";

// --- MINIMAL FADE-IN WRAPPER ---
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
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
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

    const faqs = config?.faq || [
        {
            question: "How does the AI handle unqualified leads?",
            answer: "The AI politely ends the conversation or redirects them to a highly relevant resource, preventing unqualified prospects from ever reaching your calendar or wasting your sales team's time."
        },
        {
            question: "Will it sound like a robot?",
            answer: "No. Our conversational models are tuned to match your brand's specific tone of voice—whether that's highly professional, casual, or enthusiastic. It uses natural language, appropriate pacing, and contextual understanding."
        },
        {
            question: "What platforms does it work on?",
            answer: "The core engine integrates natively with WhatsApp Business, SMS, Facebook Messenger, and Instagram DM. Wherever your leads are messaging you, the AI is there to capture them."
        },
        {
            question: "How long does it take to go live?",
            answer: "Typically under 48 hours. Our team handles the entire technical setup, knowledge base ingestion, and calendar mapping. You simply review the test bot and give the green light."
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#111827] font-sans selection:bg-[#4F46E5] selection:text-white flex flex-col items-center w-full relative overflow-hidden">

            {/* --- INJECTED STYLE --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          /* High-converting, high-trust 'Electric Indigo' */
          --primary: #4F46E5; 
          --primary-hover: #4338CA;
          /* Beautiful crisp white for cards */
          --surface: #FFFFFF;
          /* Off-white for section breaks */
          --surface-alt: #F3F4F6;
          /* Deep ink for max readability */
          --ink: #030712;
        }

        /* Subtle architect-style dot grid */
        .bg-dots {
          background-image: radial-gradient(rgba(17, 24, 39, 0.08) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}} />

            {/* --- FLOATING DOT BACKGROUND --- */}
            <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none bg-dots -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]" />

            {/* --- NAVIGATION (MINIMAL) --- */}
            <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-20 relative">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[var(--primary)]/30">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-[var(--ink)]">AutoConversion.</span>
                </div>
            </nav>

            {/* --- HERO SPLIT --- */}
            <main className="w-full max-w-7xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32 flex flex-col lg:flex-row gap-16 lg:gap-24 relative z-10">

                {/* LEFT COPY */}
                <div className="w-full lg:w-[55%] flex flex-col justify-center">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-sm font-bold text-[var(--primary)] mb-8">
                            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                            Now integrating directly with WhatsApp
                        </div>
                    </FadeIn>

                    <FadeIn delay={100}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-[var(--ink)] leading-[1.05] mb-6 text-balance">
                            Turn messages into<br />
                            <span className="text-[var(--primary)]">booked calendars.</span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={200}>
                        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-xl leading-snug font-medium text-balance">
                            A meticulously trained AI setter that works 24/7 to instantly qualify leads and secure appointments while you sleep.
                        </p>
                    </FadeIn>

                    <FadeIn delay={300}>
                        <div className="flex flex-col sm:flex-row items-center gap-8 border-t border-gray-200 pt-8 w-full">
                            <div className="flex -space-x-3">
                                {[5, 11, 19, 30].map((i) => (
                                    <div key={i} className="relative w-12 h-12 rounded-full border-2 border-[#F8F9FA] overflow-hidden bg-white shadow-sm">
                                        <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=transparent`} alt="avatar" className="w-[120%] h-[120%] object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col text-sm text-gray-600 font-medium">
                                <div className="flex items-center gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <svg key={s} className="w-4 h-4 text-[#F59E0B] fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                                <span>Trusted by <strong className="text-[var(--ink)]">400+ local agencies</strong>.</span>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                {/* RIGHT FORM - MASSIVE CONTRAST */}
                <div className="w-full lg:w-[45%] relative">
                    <FadeIn delay={400} direction="left">

                        {/* Soft decorative shadow behind the card */}
                        <div className="absolute inset-4 bg-[var(--primary)] blur-3xl opacity-[0.15] translate-y-8 rounded-full -z-10" />

                        <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group">

                            <div className="text-left mb-8">
                                <h3 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mb-2">Experience the AI</h3>
                                <p className="text-sm font-medium text-gray-500">Enter a valid phone number to receive a live, interactive demo via text immediately.</p>
                            </div>

                            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="Alex"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 text-[15px] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Smith"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 text-[15px] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">Phone Number *</label>
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 text-[15px] font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                    />
                                </div>

                                {/* Highly readable, elegant consent box */}
                                <div className="flex items-start gap-3 mt-6 pt-2 pb-2">
                                    <button
                                        type="button"
                                        className={`mt-0.5 w-5 h-5 rounded-md flex shrink-0 items-center justify-center transition-all border shadow-sm ${isConsentChecked ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-white border-gray-300 hover:border-gray-400"
                                            }`}
                                        onClick={() => setIsConsentChecked(!isConsentChecked)}
                                    >
                                        {isConsentChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                    </button>
                                    <p className="text-[12px] text-gray-500 font-medium leading-[1.6]">
                                        By checking this box, you agree to receive a live demo text to the number provided. You can type STOP at any time to end the test. Data is not shared.
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        className="group relative w-full py-4.5 rounded-xl font-bold flex items-center justify-center overflow-hidden transition-all duration-300 shadow-xl shadow-[var(--primary)]/20 active:scale-[0.98]"
                                        style={{ backgroundColor: "var(--primary)" }}
                                    >
                                        {/* Button shine effect */}
                                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                                        <span className="relative z-10 text-white text-[17px] flex items-center gap-2">
                                            Send My Live Demo
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </FadeIn>
                </div>
            </main>

            {/* --- REFINED BENTO GRID (HOW IT WORKS) --- */}
            <section className="w-full bg-[var(--surface-alt)] py-24 md:py-32 outline outline-1 outline-gray-200 border-t border-b border-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 md:mb-20">
                        <FadeIn>
                            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-[var(--ink)] mb-4">Complete booking automation.</h2>
                            <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto text-balance">We built this so you never have to manually reply to a "how much?" message ever again.</p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                        <FadeIn delay={100} direction="up">
                            <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--ink)] mb-3">1. Sub-second Replies</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">When a prospect texts you, the AI replies instantly. It hooks them into a conversation before they have time to message your competitors.</p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={200} direction="up">
                            <div className="bg-white p-8 rounded-[24px] border-2 border-[var(--primary)] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-bl-lg">Core Feature</div>
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[var(--primary)] flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--ink)] mb-3">2. Smart Vetting</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">It asks the budget, timeline, and scope questions you require. If they aren't a fit, it politely disqualifies them. Perfect leads only.</p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={300} direction="up">
                            <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                                    <CalendarCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--ink)] mb-3">3. Calendar Injection</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">Once qualified, the AI presents available slots directly from your Google/Outlook calendar and locks in the meeting seamlessly.</p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* --- MINIMAL FAQ --- */}
            <section className="w-full py-24 px-6 bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-14">
                        <FadeIn>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--ink)] tracking-tighter mb-4">Frequently asked questions.</h2>
                            <p className="text-gray-500 text-lg font-medium">Straight answers to common concerns.</p>
                        </FadeIn>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <FadeIn key={idx} delay={50 * idx} direction="up">
                                <div
                                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === idx ? 'border-[var(--primary)] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <button
                                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none bg-transparent"
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    >
                                        <span className={`font-bold text-[17px] pr-4 transition-colors ${openFaq === idx ? 'text-[var(--primary)]' : 'text-[var(--ink)]'}`}>
                                            {faq.question}
                                        </span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === idx ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-gray-100 text-gray-500'}`}>
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                                        </div>
                                    </button>
                                    <div
                                        className={`px-6 text-gray-600 font-medium text-[15px] leading-relaxed transition-all duration-300`}
                                        style={{
                                            maxHeight: openFaq === idx ? "250px" : "0",
                                            paddingBottom: openFaq === idx ? "24px" : "0",
                                            opacity: openFaq === idx ? 1 : 0
                                        }}
                                    >
                                        <p className="pt-2">{faq.answer}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- GIGANTIC FINAL CTA --- */}
            <section className="w-full bg-[var(--ink)] py-24 md:py-32 px-6 text-center text-white">
                <div className="max-w-4xl mx-auto">
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter mb-8 leading-[1.05]">
                            Stop losing money to<br className="hidden md:block" /> delayed replies.
                        </h2>
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
                            Click below to trigger a live automated conversation and see exactly what your prospective clients will experience.
                        </p>

                        <button
                            className="group relative inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.03]"
                            style={{ backgroundColor: "var(--primary)" }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <span className="text-white text-xl">Trigger Live Demo</span>
                            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                        </button>
                    </FadeIn>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="w-full bg-[#000000] py-10 px-6 text-center">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-white">AutoConversion.</span>
                    </div>

                    <div className="flex gap-8 text-[15px] text-gray-500 font-bold">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>

                    <p className="text-sm text-gray-600 font-medium">
                        © {new Date().getFullYear()} AutoConversion Ltd.
                    </p>
                </div>
            </footer>

            {/* CSS Animation helper for the button shine */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes shine {
          100% { left: 125%; }
        }
        .animate-shine {
          left: -125%;
          animation: shine 1.2s ease-in-out infinite;
        }
      `}} />
        </div>
    );
}
