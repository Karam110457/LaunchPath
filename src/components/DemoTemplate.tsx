"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, ArrowRight, PhoneOff, Clock, UserMinus, ShieldCheck, PlayCircle, Zap } from "lucide-react";

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
        direction === "up" ? "translate-y-6" :
            direction === "down" ? "-translate-y-6" :
                direction === "left" ? "translate-x-6" :
                    direction === "right" ? "-translate-x-6" : "translate-y-0 translate-x-0";

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out fill-mode-forwards ${isVisible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${translateClass}`
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        businessName: "",
        industry: "",
        phone: ""
    });

    const faqs = config?.faq || [
        {
            question: "Will the AI sound robotic to my customers?",
            answer: "No. Hear it for yourself above. Our conversational models use natural language, understand context, and adapt to your specific business tone."
        },
        {
            question: "What happens to the information I submit here?",
            answer: "Your details exist purely to run this live, personalized demo. They are securely processed and never sold to third parties."
        },
        {
            question: "How much does a system like this cost?",
            answer: "Experiencing this demo is 100% free. If you like the results we deliver on your phone right now, we can discuss a customized pricing plan tailored to your lead volume."
        }
    ];

    const handleDemoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConsentChecked) return;

        setIsSubmitting(true);

        // Simulate API request/submission
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans selection:bg-[#4F46E5] selection:text-white flex flex-col justify-center w-full relative overflow-x-hidden">

            {/* --- INJECTED STYLE --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          /* High-converting 'Electric Indigo' */
          --primary: #4F46E5; 
          --primary-hover: #4338CA;
          /* Off-white background */
          --surface: #FFFFFF;
          /* Deep ink text */
          --ink: #0F172A;
        }

        /* Subtle noise texture for premium tactile feel */
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.02;
          pointer-events: none;
        }
      `}} />

            {/* --- BACKGROUND FX --- */}
            <div className="absolute inset-0 bg-noise z-0 mix-blend-overlay" />
            <div className="absolute top-0 right-0 w-[50vw] h-[500px] bg-[var(--primary)]/5 blur-[120px] rounded-bl-full pointer-events-none -z-10" />

            {/* NO NAVIGATION BAR - One page, One action */}

            {/* --- HERO SPLIT --- */}
            <main className="w-full max-w-6xl mx-auto px-5 pt-12 pb-16 md:pt-20 md:pb-24 flex flex-col lg:flex-row gap-12 lg:gap-16 relative z-10">

                {/* LEFT: COPY & AGITATION */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">

                    <FadeIn>
                        <h1 className="text-[2.5rem] sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tighter text-[var(--ink)] leading-[1.05] mb-5 text-balance">
                            Never Miss A Hot Lead Again.<br />
                            <span className="text-[var(--primary)] text-[2.2rem] sm:text-4xl md:text-[3rem] font-bold block mt-3">
                                AI That Qualifies Callers 24/7.
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={100}>
                        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-lg leading-snug font-medium text-balance">
                            See how it handles your leads live. It takes exactly 60 seconds to try it below.
                        </p>
                    </FadeIn>

                    {/* PAIN AGITATION BLOCK (Crucial for local biz) */}
                    <FadeIn delay={200}>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10 max-w-lg relative">
                            <div className="absolute -left-2 top-6 w-1 h-12 bg-rose-500 rounded-r-md"></div>
                            <p className="text-sm md:text-base font-semibold text-slate-700 leading-relaxed">
                                <strong className="text-slate-900 block mb-1">The reality right now:</strong>
                                You're working a job site, missing calls, and losing leads to voicemail. By the time you call them back, they've already booked your competitor. You can't be on the phone all day.
                            </p>
                        </div>
                    </FadeIn>

                    {/* SCROLL CTA - Replaces navigation */}
                    <FadeIn delay={300}>
                        <button
                            onClick={() => document.getElementById('demo-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className="inline-flex items-center gap-2 text-slate-600 font-bold hover:text-[var(--primary)] transition-colors group px-1 py-2"
                        >
                            See It Handle A Real Lead <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </FadeIn>

                </div>

                {/* RIGHT: THE CRITICAL DEMO FORM */}
                <div className="w-full lg:w-1/2 relative" id="demo-start">
                    <FadeIn delay={200} direction="left">

                        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 relative overflow-hidden flex flex-col">

                            {/* Form Header */}
                            <div className="bg-slate-50 border-b border-slate-100 p-6 md:px-8 py-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--ink)] tracking-tight">Try The AI Live</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-0.5">Tell us about your business so the AI can introduce itself correctly.</p>
                                </div>
                                <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center shrink-0">
                                    <PlayCircle className="w-5 h-5" fill="currentColor" stroke="white" />
                                </div>
                            </div>

                            {/* Dynamic State: Form vs Success */}
                            {!isSuccess ? (
                                <form className="p-6 md:p-8 space-y-5 flex-grow" onSubmit={handleDemoSubmit}>

                                    {/* Minimized Fields - Max 4 */}
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-slate-700">Business Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="e.g. Acme Plumbing"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 min-h-[44px] text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-slate-700">Industry / Type</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.industry}
                                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-4 pr-10 py-3 min-h-[44px] text-[16px] font-medium appearance-none focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
                                            >
                                                <option value="" disabled hidden>Select your service...</option>
                                                <option value="plumbing">Plumbing & HVAC</option>
                                                <option value="roofing">Roofing & Contracting</option>
                                                <option value="cleaning">Home Cleaning</option>
                                                <option value="legal">Legal Services</option>
                                                <option value="other">Other Local Service</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-bold text-slate-700">Your Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 min-h-[44px] text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-bold text-slate-700">Mobile Phone</label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(555) 000-0000"
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 min-h-[44px] text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* High Trust Consent */}
                                    <div className="flex items-start gap-3 mt-2 pt-2 pb-2">
                                        <button
                                            type="button"
                                            className={`mt-0.5 min-w-[20px] min-h-[20px] w-5 h-5 rounded-md flex shrink-0 items-center justify-center transition-all border shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${isConsentChecked ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-white border-slate-300 hover:border-slate-400"
                                                }`}
                                            onClick={() => setIsConsentChecked(!isConsentChecked)}
                                        >
                                            {isConsentChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                        </button>
                                        <p className="text-[12px] text-slate-500 font-medium leading-[1.5]">
                                            I consent to receive a one-time live demo text to the number above. Reply STOP to end.
                                        </p>
                                    </div>

                                    {/* Outcome Based CTA */}
                                    <button
                                        disabled={isSubmitting || !isConsentChecked}
                                        className="w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all duration-300 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl active:scale-[0.98] mt-2 min-h-[56px] disabled:opacity-70 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: "var(--primary)" }}
                                    >
                                        <span className="text-white text-[16px] md:text-[18px]">
                                            {isSubmitting ? "Generating Custom Demo..." : "Start My Free Demo"}
                                        </span>
                                    </button>

                                </form>
                            ) : (
                                // --- POST FORM EXPERIENCE ---
                                <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center flex-grow bg-slate-50/50">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                                        <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">The AI is texting you now.</h3>
                                    <p className="text-slate-600 font-medium mb-8">
                                        <span className="font-bold text-slate-900">{formData.name}</span>, please check your mobile device at <span className="font-bold">{formData.phone}</span>.
                                    </p>

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 text-left w-full shadow-sm">
                                        <p className="text-slate-800 font-bold mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500 fill-current" /> Next Steps:</p>
                                        <ul className="space-y-2 list-disc pl-5">
                                            <li>Interact directly with the AI via text.</li>
                                            <li>Ask it any hard questions about {formData.industry === "other" || !formData.industry ? "your business" : formData.industry}.</li>
                                            <li>Try to schedule an appointment with it.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Adjacent Social Proof attached to Form Base */}
                            <div className="bg-slate-900 px-6 py-4 flex items-center justify-center gap-3 w-full">
                                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span className="text-[13px] md:text-sm font-semibold text-slate-200">
                                    Responds to leads in under 3 seconds, 24/7.
                                </span>
                            </div>

                        </div>
                    </FadeIn>
                </div>
            </main>

            {/* --- HOW IT WORKS (3 Simple Steps) --- */}
            <section className="w-full bg-white py-16 md:py-24 border-y border-slate-200 my-4 shadow-sm relative z-0">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="text-center mb-12">
                        <FadeIn>
                            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tighter text-[var(--ink)] mb-3">How this Demo works.</h2>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">
                        <FadeIn delay={100} direction="up">
                            <div className="flex flex-col items-center md:items-start group">
                                <div className="text-5xl font-black text-slate-100 group-hover:text-[var(--primary)]/10 transition-colors mb-2 -ml-2">1</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Enter your details above</h3>
                                <p className="text-slate-600 font-medium text-[15px] leading-relaxed">Fill out the short form so we can contextualize the AI to represent your business.</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={200} direction="up">
                            <div className="flex flex-col items-center md:items-start group">
                                <div className="text-5xl font-black text-slate-100 group-hover:text-[var(--primary)]/10 transition-colors mb-2 -ml-2">2</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Try the AI live via SMS</h3>
                                <p className="text-slate-600 font-medium text-[15px] leading-relaxed">You will immediately receive a text from our AI. Talk to it just like a prospect would.</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={300} direction="up">
                            <div className="flex flex-col items-center md:items-start group">
                                <div className="text-5xl font-black text-slate-100 group-hover:text-[var(--primary)]/10 transition-colors mb-2 -ml-2">3</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Experience the booking</h3>
                                <p className="text-slate-600 font-medium text-[15px] leading-relaxed">Watch exactly how the AI qualifies you and seamlessly drops an appointment onto your calendar.</p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION DE-RISKING --- */}
            <section className="w-full py-16 px-5 max-w-3xl mx-auto mb-12">
                <div className="mb-10 text-center md:text-left">
                    <FadeIn>
                        <h2 className="text-2xl md:text-3xl font-bold text-[var(--ink)] tracking-tight mb-2">Frequently asked questions</h2>
                    </FadeIn>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <FadeIn key={idx} delay={50 * idx} direction="up">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <button
                                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className={`font-bold text-[15px] pr-4 ${openFaq === idx ? 'text-[var(--primary)]' : 'text-slate-800'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${openFaq === idx ? 'text-[var(--primary)]' : 'text-slate-400'}`}>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                                    </div>
                                </button>
                                <div
                                    className={`px-5 text-slate-600 font-medium text-[14px] leading-relaxed transition-all duration-300`}
                                    style={{
                                        maxHeight: openFaq === idx ? "150px" : "0",
                                        paddingBottom: openFaq === idx ? "16px" : "0",
                                        opacity: openFaq === idx ? 1 : 0
                                    }}
                                >
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* --- FOOTER (Powered By LaunchPath Branding) --- */}
            <footer className="w-full bg-[#0F172A] py-8 px-5 text-center mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 opacity-60 mb-2">
                        <span className="text-[12px] font-medium text-slate-400">Powered by</span>
                        <Zap className="w-3.5 h-3.5 text-[var(--primary)] fill-current" />
                        <span className="text-[13px] font-bold tracking-tight text-white">LaunchPath AI</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium mt-2">
                        © {new Date().getFullYear()} LaunchPath. All rights reserved. | Demo purposes only.
                    </p>
                </div>
            </footer>

        </div>
    );
}
