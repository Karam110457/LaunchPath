"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, ArrowRight, PhoneOff, Clock, UserMinus, ShieldCheck, PlayCircle, Zap, MessageSquare } from "lucide-react";

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

// --- DYNAMIC CHAT VISUALIZATION ---
function LiveChatSimulation() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const intervals = [
            setTimeout(() => setStep(1), 500),
            setTimeout(() => setStep(2), 1800),
            setTimeout(() => setStep(3), 3200),
            setTimeout(() => setStep(4), 4800)
        ];
        return () => intervals.forEach(clearTimeout);
    }, []);

    return (
        <div className="relative mt-8 md:mt-12 w-full max-w-[420px] rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl overflow-hidden self-center lg:self-start">
            {/* App Header */}
            <div className="bg-[#128C7E] px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white fill-current" />
                </div>
                <div>
                    <h4 className="text-white font-semibold text-sm">Booking Agent</h4>
                    <p className="text-emerald-100 text-[10px]">Online</p>
                </div>
            </div>

            {/* Chat Thread */}
            <div className="p-4 bg-[#E5DDD5]/20 h-[220px] flex flex-col gap-3 overflow-hidden relative">
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

                {/* Step 1: Inbound Lead */}
                <div className={`transition-all duration-500 transform ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-white px-3 py-2 rounded-2xl rounded-tr-md shadow-sm max-w-[85%] self-end ml-auto">
                        <p className="text-[#111] text-[13px] leading-snug">Hey, looking to get a quote for a new roof install this month.</p>
                    </div>
                </div>

                {/* Step 2: Instant AI Reply */}
                <div className={`transition-all duration-500 transform delay-100 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-[#DCF8C6] px-3 py-2 rounded-2xl rounded-tl-md shadow-sm max-w-[85%] border border-green-100/50">
                        <p className="text-[#111] text-[13px] leading-snug">Hi! Absolutely. I can help you with that. Are you the homeowner?</p>
                        <p className="text-[9px] text-green-700/60 mt-1 flex justify-end items-center gap-0.5"><Check className="w-3 h-3" /><Check className="w-3 h-3 -ml-2" /></p>
                    </div>
                </div>

                {/* Step 3: Lead Qualifies */}
                <div className={`transition-all duration-500 transform delay-200 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-white px-3 py-2 rounded-2xl rounded-tr-md shadow-sm max-w-[85%] self-end ml-auto">
                        <p className="text-[#111] text-[13px] leading-snug">Yes I am. Property is in Austin.</p>
                    </div>
                </div>

                {/* Step 4: AI Books */}
                <div className={`transition-all duration-500 transform delay-300 ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="bg-[#DCF8C6] px-3 py-2 rounded-2xl rounded-tl-md shadow-sm max-w-[90%] border border-green-100/50 flex flex-col gap-2">
                        <p className="text-[#111] text-[13px] leading-snug">Great. Our team is available Tuesday at 10 AM or Wednesday at 2 PM for an inspection. Which works best?</p>
                        <div className="bg-white/50 rounded-lg p-2 flex items-center gap-2 border border-green-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                            <div className="w-8 h-8 rounded bg-green-500/20 text-green-700 flex flex-col items-center justify-center leading-none">
                                <span className="text-[8px] font-bold uppercase">Oct</span>
                                <span className="text-xs font-black">12</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-800">Inspection Scheduled</span>
                                <span className="text-[10px] text-slate-500">Added to your synced calendar</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
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
        <div className="min-h-screen bg-[#FDFDFD] text-[#0F172A] font-sans selection:bg-[#4F46E5] selection:text-white flex flex-col justify-center w-full relative overflow-x-hidden">

            {/* --- INJECTED SYTLE --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          --primary: #4F46E5; 
          --primary-hover: #4338CA;
          --ink: #0F172A;
        }

        /* Moving Gradient Mesh */
        .color-mesh {
          background-image: 
            radial-gradient(at 40% 20%, hsla(245,100%,79%,1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189,100%,76%,1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%),
            radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%);
          filter: blur(80px);
          opacity: 0.15;
          animation: breath 15s ease-in-out infinite alternate;
        }

        @keyframes breath {
           0% { transform: scale(1) translate(0%, 0%); }
           50% { transform: scale(1.05) translate(2%, 2%); }
           100% { transform: scale(1) translate(0%, 0%); }
        }

        .bg-dots {
          background-image: radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px);
          background-size: 32px 32px;
        }
      `}} />

            {/* --- BACKGROUND FX --- */}
            <div className="absolute inset-0 color-mesh -z-20 pointer-events-none" />
            <div className="absolute inset-0 bg-dots pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,white,transparent_80%)]" />
            <div className="absolute top-0 right-0 w-[60vw] h-[600px] bg-gradient-to-bl from-[var(--primary)]/10 to-transparent pointer-events-none -z-10 rounded-bl-full mix-blend-multiply" />


            {/* --- HERO SPLIT --- */}
            <main className="w-full max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-32 flex flex-col lg:flex-row gap-12 lg:gap-20 relative z-10 items-center lg:items-center min-h-[90vh]">

                {/* LEFT: COPY, VISUALIZATION & AGITATION */}
                <div className="w-full lg:w-[55%] flex flex-col justify-center">

                    <div className="flex flex-col items-start w-full">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 shadow-sm rounded-full mb-6">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Built For Local Businesses</span>
                            </div>
                        </FadeIn>

                        <FadeIn delay={100}>
                            <h1 className="text-[2.75rem] sm:text-5xl md:text-[4rem] font-extrabold tracking-tighter text-[var(--ink)] leading-[1.02] mb-5 text-balance drop-shadow-sm">
                                Never Miss A Hot Lead.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-indigo-400 pb-2 inline-block">
                                    AI That Qualifies 24/7.
                                </span>
                            </h1>
                        </FadeIn>

                        <FadeIn delay={200}>
                            <p className="text-lg md:text-xl text-slate-600 mb-6 max-w-lg leading-snug font-medium text-balance">
                                See how it handles your leads live. It takes exactly 60 seconds to try it out below.
                            </p>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <a
                                href="#demo-start"
                                className="inline-flex items-center gap-2 text-[var(--primary)] font-bold hover:text-[var(--primary-hover)] transition-colors group py-2 text-lg mb-8"
                            >
                                See It Handle A Real Lead <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </FadeIn>

                        {/* PAIN AGITATION BLOCK (Crucial for local biz) */}
                        <FadeIn delay={400}>
                            <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-2xl p-6 shadow-sm max-w-lg relative transition-all hover:bg-white hover:shadow-md">
                                <div className="absolute -left-[1px] top-6 w-[3px] h-12 bg-rose-500 rounded-r-md"></div>
                                <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                                    <strong className="text-slate-900 block mb-1">The reality right now:</strong>
                                    You're working a job site, missing calls, and losing leads to voicemail. By the time you call them back, they've already booked your competitor. You can't be on the phone all day.
                                </p>
                            </div>
                        </FadeIn>
                    </div>

                </div>

                {/* RIGHT: THE CRITICAL DEMO FORM + CHAT VISUALIZATION */}
                <div className="w-full lg:w-[45%] relative flex flex-col items-center lg:items-end">

                    <FadeIn delay={200} direction="left" className="w-full">
                        {/* Ambient Shadow Box for intense Pop */}
                        <div className="absolute inset-x-4 -inset-y-4 rounded-[40px] bg-[var(--primary)]/10 blur-3xl -z-10 animate-pulse [animation-duration:8s]" />

                        <div className="w-full bg-white rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 relative overflow-hidden flex flex-col" id="demo-start">

                            {/* Form Header */}
                            <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 p-6 md:px-8 md:pt-8 md:pb-6 flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--ink)] tracking-tight">Try The AI Live</h3>
                                    <p className="text-[13px] font-medium text-slate-500 mt-1 max-w-[250px] leading-relaxed">Tell us about your business so the AI can introduce itself correctly.</p>
                                </div>
                                <div className="w-12 h-12 bg-indigo-50 text-[var(--primary)] rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50">
                                    <MessageSquare className="w-6 h-6" fill="currentColor" stroke="white" strokeWidth={1} />
                                </div>
                            </div>

                            {/* Dynamic State: Form vs Success */}
                            {!isSuccess ? (
                                <form className="p-6 md:p-8 space-y-6 flex-grow" onSubmit={handleDemoSubmit}>

                                    {/* Minimized Fields - Max 4 */}
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Business Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="e.g. Acme Plumbing"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 min-h-[48px] text-[15px] font-semibold placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Industry</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.industry}
                                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-4 pr-10 py-3 min-h-[48px] text-[15px] font-semibold appearance-none focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all shadow-sm cursor-pointer"
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
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Your Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 min-h-[48px] text-[15px] font-semibold placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Mobile Phone</label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(555) 000-0000"
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 min-h-[48px] text-[15px] font-semibold placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* High Trust Consent */}
                                    <div className="flex items-start gap-3 mt-4 pt-2 -mx-2 px-2 pb-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setIsConsentChecked(!isConsentChecked)}>
                                        <button
                                            type="button"
                                            className={`mt-0.5 min-w-[20px] min-h-[20px] w-5 h-5 rounded-[6px] flex shrink-0 items-center justify-center transition-all border shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] ${isConsentChecked ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-white border-slate-300"
                                                }`}
                                        >
                                            {isConsentChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                        </button>
                                        <p className="text-[12px] text-slate-500 font-medium leading-[1.5] select-none">
                                            I consent to receive a one-time live demo text to the number above. Reply STOP to end.
                                        </p>
                                    </div>

                                    {/* Outcome Based CTA */}
                                    <button
                                        disabled={isSubmitting || !isConsentChecked}
                                        className="group w-full py-4.5 rounded-xl font-black flex items-center justify-center transition-all duration-300 shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_40px_rgba(79,70,229,0.4)] active:scale-[0.98] mt-2 min-h-[60px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none overflow-hidden relative"
                                        style={{ backgroundColor: "var(--primary)" }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                        <span className="relative z-10 text-white text-[16px] md:text-[18px] tracking-wide drop-shadow-sm flex items-center gap-2">
                                            {isSubmitting ? "Generating Custom Demo..." : "Start My Free Demo"}
                                            {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
                                        </span>
                                    </button>

                                </form>
                            ) : (
                                // --- POST FORM EXPERIENCE ---
                                <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center flex-grow bg-slate-50/50">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 animate-pulse" />
                                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-white shadow-sm relative z-10">
                                            <Check className="w-10 h-10 text-emerald-600" strokeWidth={3} />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">The AI is texting you.</h3>
                                    <p className="text-slate-600 font-medium text-lg mb-10 max-w-[280px]">
                                        <span className="font-bold text-slate-900">{formData.name}</span>, please check your mobile device at <span className="font-bold">{formData.phone}</span>
                                    </p>

                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 text-[15px] font-medium text-slate-600 text-left w-full shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 inset-x-0 h-1 bg-[var(--primary)]" />
                                        <p className="text-slate-800 font-bold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500 fill-current" /> Required Next Steps:</p>
                                        <ul className="space-y-3 list-disc pl-5">
                                            <li className="pl-1 leading-snug">Interact directly with the AI via text.</li>
                                            <li className="pl-1 leading-snug">Ask it hard questions about {formData.industry === "other" || !formData.industry ? "your business" : formData.industry}.</li>
                                            <li className="pl-1 leading-snug">Try to schedule an appointment with it.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Adjacent Social Proof attached to Form Base */}
                            <div className="bg-slate-900 px-6 py-5 flex items-center justify-center gap-3 w-full border-t border-slate-800">
                                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span className="text-[13px] md:text-[14px] font-semibold text-slate-200 tracking-wide">
                                    Responds to leads in under 3 seconds, 24/7.
                                </span>
                            </div>

                        </div>
                    </FadeIn>

                    <FadeIn delay={500} direction="up" className="w-full">
                        <LiveChatSimulation />
                    </FadeIn>
                </div>
            </main>

            {/* --- HOW IT WORKS (3 Simple Steps) --- */}
            <section className="w-full bg-white pt-24 pb-20 md:pt-32 md:pb-28 border-y border-slate-200 shadow-sm relative z-0">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16 md:mb-20">
                        <FadeIn>
                            <h2 className="text-3xl md:text-[44px] font-extrabold tracking-tighter text-[var(--ink)] mb-4">How this Demo works.</h2>
                            <p className="text-lg text-slate-500 font-medium">Follow the steps below to experience the magic.</p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10 md:gap-16 text-center md:text-left relative">
                        <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-slate-100 -z-10" />

                        <FadeIn delay={100} direction="up">
                            <div className="flex flex-col items-center md:items-start group relative">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-[var(--primary)] text-[var(--primary)] flex items-center justify-center text-2xl font-black mb-6 shadow-[0_0_20px_rgba(79,70,229,0.15)] bg-white z-10">1</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Enter your details</h3>
                                <p className="text-slate-500 font-medium text-[16px] leading-relaxed">Fill out the short form above so we can logically contextualize the AI to represent your business.</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={200} direction="up">
                            <div className="flex flex-col items-center md:items-start group relative">
                                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center text-2xl font-black mb-6 z-10 transition-colors group-hover:border-[var(--primary)] group-hover:text-[var(--primary)] shadow-sm">2</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Try the AI live</h3>
                                <p className="text-slate-500 font-medium text-[16px] leading-relaxed">You will immediately receive a text from our AI. Talk to it just like a cold prospect would.</p>
                            </div>
                        </FadeIn>
                        <FadeIn delay={300} direction="up">
                            <div className="flex flex-col items-center md:items-start group relative">
                                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 text-slate-400 flex items-center justify-center text-2xl font-black mb-6 z-10 transition-colors group-hover:border-emerald-500 group-hover:text-emerald-500 shadow-sm">3</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Experience Booking</h3>
                                <p className="text-slate-500 font-medium text-[16px] leading-relaxed">Watch precisely how the AI qualifies your intent and seamlessly drops an appointment onto your calendar.</p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* --- FAQ SECTION DE-RISKING --- */}
            <section className="w-full py-20 px-6 max-w-4xl mx-auto mb-12">
                <div className="mb-12 text-center md:text-left">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--ink)] tracking-tight mb-2">Frequently asked questions</h2>
                        <p className="text-lg text-slate-500 font-medium">Straight answers, no fluff.</p>
                    </FadeIn>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <FadeIn key={idx} delay={50 * idx} direction="up">
                            <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${openFaq === idx ? 'border-[var(--primary)] shadow-[0_5px_20px_rgba(79,70,229,0.1)]' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                                <button
                                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className={`font-bold text-[16px] pr-4 ${openFaq === idx ? 'text-[var(--primary)]' : 'text-slate-800'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === idx ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-slate-50 text-slate-400'}`}>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                                    </div>
                                </button>
                                <div
                                    className={`px-6 text-slate-600 font-medium text-[15px] leading-relaxed transition-all duration-300`}
                                    style={{
                                        maxHeight: openFaq === idx ? "150px" : "0",
                                        paddingBottom: openFaq === idx ? "24px" : "0",
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
            <footer className="w-full bg-[#0F172A] py-10 px-6 text-center mt-auto border-t border-slate-800/50">
                <div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 opacity-60 mb-3 hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-[13px] font-medium text-slate-400">Powered by</span>
                        <Zap className="w-4 h-4 text-[var(--primary)] fill-current" />
                        <span className="text-[14px] font-bold tracking-tight text-white drop-shadow-sm">LaunchPath AI</span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                        © {new Date().getFullYear()} LaunchPath. All rights reserved. | Demo purposes only.
                    </p>
                </div>
            </footer>

        </div>
    );
}
