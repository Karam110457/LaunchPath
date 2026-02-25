"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, ArrowRight, PhoneOff, Clock, UserMinus, ShieldCheck, PlayCircle, Zap, Star } from "lucide-react";

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
        <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans selection:bg-[#4F46E5] selection:text-white flex flex-col justify-start w-full relative overflow-x-hidden">

            {/* --- INJECTED STYLE --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          /* High-converting 'Electric Indigo' */
          --primary: #4F46E5; 
          --primary-hover: #4338CA;
        }

        /* Subtle noise texture for premium tactile feel */
        .bg-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        /* 3D Depth Utilities to fix "Flatness" */
        .btn-3d {
          box-shadow: inset 0px 1px 0px 0px rgba(255,255,255,0.4), 0 10px 20px -5px rgba(79,70,229,0.4);
          background: linear-gradient(180deg, var(--primary) 0%, var(--primary-hover) 100%);
        }
        
        .card-shadow-premium {
          box-shadow: 0 0 0 1px rgba(0,0,0,0.03), 0 30px 60px -12px rgba(0,0,0,0.12);
        }
      `}} />

            {/* --- ATTENTION ANNOUNCEMENT BAR --- */}
            <div className="w-full bg-[#0F172A] text-slate-200 text-center py-2.5 px-4 text-xs sm:text-sm font-medium z-50 relative border-b border-white/5 shadow-md flex items-center justify-center">
                <span className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--primary)" }}></span>
                    </span>
                    <span><strong className="font-extrabold text-white hidden sm:inline">Limited Availability:</strong> Currently accepting 5 new local businesses for our Q1 beta pilot.</span>
                </span>
            </div>

            {/* --- BACKGROUND FX WITH DEPTH GRID --- */}
            <div className="absolute inset-0 bg-noise z-0 mix-blend-overlay mt-10" />
            {/* Structural Grid overlay fading radially to fix the flat background */}
            <div className="absolute inset-0 mt-10 z-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-10 right-0 w-[50vw] h-[500px] bg-[var(--primary)]/10 blur-[120px] rounded-bl-full pointer-events-none -z-10" />


            {/* --- HERO SPLIT (Mobile Visual Hierarchy Optimized) --- */}
            <main className="w-full max-w-6xl mx-auto px-5 pt-8 pb-16 md:pt-16 md:pb-24 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 gap-y-10 relative z-10">

                {/* ROW 1 LEFT: HEADLINE */}
                <div className="flex flex-col justify-end lg:pr-4">
                    <FadeIn>
                        {/* Glowing pill to add layering above headline */}
                        <div className="inline-flex items-center gap-2 px-3 pl-2 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm text-[var(--primary)] text-[13px] font-bold mb-6">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Star className="w-3 h-3 fill-current text-[var(--primary)]" />
                            </div>
                            The 1-Sentence Offer Live Demo
                        </div>

                        {/* 1-SENTENCE OFFER FRAMEWORK HEADLINE */}
                        {/* Reveal How + Avatar + Result + Mechanism + Timeframe */}
                        <h1 className="text-[2.2rem] sm:text-4xl md:text-[3.2rem] font-extrabold tracking-tighter text-[#0F172A] leading-[1.05] mb-5 text-balance drop-shadow-sm">
                            How <span className="text-[var(--primary)] relative inline-block">Local Businesses
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-200 -z-10 opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0,5 Q50,0 100,5" stroke="currentColor" strokeWidth="4" fill="transparent" /></svg>
                            </span> Turn Missed Calls Into Paid Jobs <br className="hidden md:block" />
                            <span className="text-slate-500 font-bold block mt-3 text-[1.5rem] sm:text-2xl md:text-[2rem] leading-tight">
                                By using a 24/7 AI Receptionist in under 60 seconds.
                            </span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={100}>
                        <p className="text-lg md:text-xl text-slate-600 mb-2 max-w-lg leading-snug font-medium text-balance">
                            Test the exact mechanism live to see if our system can effortlessly lock in appointments right on your phone screen.
                        </p>
                    </FadeIn>
                </div>

                {/* RIGHT (or direct center on Mobile): THE CONVERSION FORM */}
                <div className="lg:row-span-2 relative w-full lg:max-w-md xl:max-w-lg mx-auto lg:mx-0 lg:ml-auto" id="demo-start">
                    <FadeIn delay={150} direction="left">

                        {/* PREMIUM ELEVATED CARD WITH INNER LAYER */}
                        <div className="bg-white rounded-[24px] card-shadow-premium relative overflow-hidden flex flex-col pt-1.5 border border-white">

                            {/* Premium Top Gradient Edge */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                            {/* Form Header */}
                            <div className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 p-6 md:px-8 py-7 flex items-center justify-between z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Try The AI Live Now</h3>
                                    <p className="text-[13px] md:text-sm font-medium text-slate-500 mt-1 drop-shadow-sm">Contextualize the AI for your business below.</p>
                                </div>
                                <div className="w-11 h-11 bg-indigo-50 text-[var(--primary)] rounded-full flex items-center justify-center shrink-0 border border-indigo-100/50 shadow-sm">
                                    <PlayCircle className="w-5 h-5" fill="currentColor" stroke="white" />
                                </div>
                            </div>

                            {/* Dynamic State: Form vs Success */}
                            {!isSuccess ? (
                                <form className="p-6 md:p-8 space-y-4 md:space-y-5 flex-grow bg-white z-10" onSubmit={handleDemoSubmit}>

                                    {/* Minimized Fields with Inner Shadow for depth on inputs */}
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-slate-700">Business Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="e.g. Acme Plumbing"
                                            className="w-full bg-[#f8fafc] border border-slate-200/80 text-slate-900 rounded-xl px-4 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-slate-700">What service do you provide?</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.industry}
                                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                className="w-full bg-[#f8fafc] border border-slate-200/80 text-slate-900 rounded-xl pl-4 pr-10 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium appearance-none focus:outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-inner"
                                            >
                                                <option value="" disabled hidden>Select your service...</option>
                                                <option value="plumbing">Plumbing & HVAC</option>
                                                <option value="roofing">Roofing & Contracting</option>
                                                <option value="cleaning">Home Cleaning</option>
                                                <option value="legal">Legal Services</option>
                                                <option value="other">Other Local Service</option>
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Forced stack on mobile using grid-cols-1 */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-bold text-slate-700">Your First Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John"
                                                className="w-full bg-[#f8fafc] border border-slate-200/80 text-slate-900 rounded-xl px-4 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[13px] font-bold text-slate-700">Mobile Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(555) 000-0000"
                                                className="w-full bg-[#f8fafc] border border-slate-200/80 text-slate-900 rounded-xl px-4 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {/* High Trust Consent */}
                                    <div className="flex items-start gap-3 md:mt-2 pt-2 pb-2">
                                        <button
                                            type="button"
                                            className={`mt-0.5 min-w-[20px] min-h-[20px] w-5 h-5 rounded-md flex shrink-0 items-center justify-center transition-all border shadow-[inset_0px_1px_rgba(255,255,255,0.4)] ${isConsentChecked ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-white border-slate-300 hover:border-slate-400 shadow-sm"
                                                }`}
                                            onClick={() => setIsConsentChecked(!isConsentChecked)}
                                        >
                                            {isConsentChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                        </button>
                                        <p className="text-[11px] md:text-[12px] text-slate-500 font-medium leading-[1.5]">
                                            I consent to receive a one-time live demo text to the number above. Reply STOP to end.
                                        </p>
                                    </div>

                                    {/* 3D Premium Gradient Outline Button */}
                                    <button
                                        disabled={isSubmitting || !isConsentChecked}
                                        className="btn-3d w-full py-4.5 md:py-4.5 rounded-xl font-bold flex items-center justify-center transition-all duration-300 hover:brightness-110 active:scale-[0.98] mt-2 min-h-[56px] md:min-h-[60px] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                        <span className="text-white text-[16px] md:text-[19px] relative z-10" style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.15)" }}>
                                            {isSubmitting ? "Connecting to AI..." : "Start My Free Demo Now"}
                                        </span>
                                    </button>

                                    {/* FUD Reducer */}
                                    <div className="text-center w-full mt-2 md:mt-3">
                                        <p className="text-[11px] md:text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Free Demo. No Credit Card Needed.</p>
                                    </div>

                                </form>
                            ) : (
                                // --- POST FORM EXPERIENCE (The Magic Moment) ---
                                <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center flex-grow bg-slate-50/50 z-10">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-inner border border-emerald-50">
                                        <Check className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" strokeWidth={4} />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">The AI is texting you now.</h3>
                                    <p className="text-slate-600 font-medium text-base md:text-lg mb-8">
                                        <strong className="text-slate-900">{formData.name || "There"}</strong>, please check your mobile device at <strong className="text-slate-900">{formData.phone}</strong>.
                                    </p>

                                    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 text-left w-full shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                        <p className="text-slate-800 font-bold text-[15px] md:text-base mb-3 flex items-center gap-2 drop-shadow-sm"><Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-current" /> Next Steps to experience the power:</p>
                                        <ul className="space-y-3 list-none pl-1 text-[13px] md:text-[14px]">
                                            <li className="flex items-start gap-2"><span className="text-[var(--primary)] font-bold">1.</span> Reply to the text message.</li>
                                            <li className="flex items-start gap-2"><span className="text-[var(--primary)] font-bold">2.</span> Ask it any hard questions about {formData.industry === "other" || !formData.industry ? "your business" : formData.industry}.</li>
                                            <li className="flex items-start gap-2"><span className="text-[var(--primary)] font-bold">3.</span> Instruct it to schedule an appointment with you.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FadeIn>
                </div>

                {/* ROW 2 LEFT: AGITATION & SOCIAL PROOF */}
                <div className="flex flex-col justify-start lg:pr-4">
                    {/* 5. True Verifiable Social Proof */}
                    <FadeIn delay={200}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex -space-x-2">
                                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Michael" alt="Michael" className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 shadow-sm" />
                                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah" alt="Sarah" className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 shadow-sm" />
                                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=David" alt="David" className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 shadow-sm" />
                            </div>
                            <div className="flex flex-col text-sm">
                                <div className="flex items-center gap-1 drop-shadow-sm">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-amber-500 fill-current" />)}
                                </div>
                                <p className="text-slate-600 font-medium text-[13px] md:text-[14px]">Joined by <strong className="text-slate-900">400+ Local Businesses</strong></p>
                            </div>
                        </div>
                    </FadeIn>

                    {/* 2. Emotional Agitation / PAS Framework (Lesson 2) */}
                    <FadeIn delay={250}>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 max-w-lg relative shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                            <div className="absolute -left-2 top-6 w-1 h-12 bg-rose-500 rounded-r-md shadow-sm"></div>
                            <p className="text-[14px] md:text-[15px] text-slate-700 leading-relaxed font-medium">
                                <strong className="text-slate-900 block mb-1 drop-shadow-sm">We know the feeling:</strong>
                                You're working a job site, you miss a call, and lose the lead to voicemail. By the time you call them back 3 hours later, <strong className="text-slate-900">they've already paid your competitor</strong> who answered immediately.
                            </p>
                        </div>
                    </FadeIn>
                </div>

            </main>

            {/* --- SCANNABLE VALUE PROP / HOW IT WORKS --- */}
            <section className="w-full bg-slate-50 py-16 md:py-28 border-y border-slate-200/60 shadow-[inset_0px_2px_10px_rgba(0,0,0,0.02)] relative z-0 mt-8 md:mt-0">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="text-center md:text-left mb-12 md:mb-16 max-w-2xl">
                        <FadeIn>
                            {/* 4. Bold Benefit-Driven Headline */}
                            <h2 className="text-[1.75rem] md:text-[2.5rem] font-extrabold tracking-tight text-[#0F172A] mb-4 leading-tight drop-shadow-sm">Turn missed calls into booked jobs automatically.</h2>
                            <p className="text-slate-600 md:text-lg font-medium">Your business doesn't stop, so neither should your reception. Here is exactly what the AI achieves for you.</p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12 text-left">
                        <FadeIn delay={100} direction="up">
                            {/* 3D Depth Card with Hover Translate */}
                            <div className="flex flex-col group h-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                {/* Active Colored Top border on Hover */}
                                <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300" />
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-200/50 shadow-inner">
                                    <PlayCircle className="w-6 h-6" />
                                </div>
                                {/* Formatting for scanning: Bold core value */}
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3 drop-shadow-sm"><span className="text-blue-600 border-b-2 border-blue-200">Sub-second</span> Engagement</h3>
                                <p className="text-slate-600 font-medium text-[14px] md:text-[15px] leading-relaxed">When a prospect texts you, the AI replies instantly. It hooks them into a conversation <strong className="text-slate-900">before they have time to message your competitors.</strong></p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={200} direction="up">
                            <div className="flex flex-col group h-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300" />
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6 border border-amber-200/50 shadow-inner">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3 drop-shadow-sm"><span className="text-amber-600 border-b-2 border-amber-200">Ruthless</span> Qualification</h3>
                                <p className="text-slate-600 font-medium text-[14px] md:text-[15px] leading-relaxed">It asks the budget, timeline, and scope questions you require. If they aren't a fit, it politely disqualifies them. <strong className="text-slate-900">You only talk to perfect leads.</strong></p>
                            </div>
                        </FadeIn>

                        <FadeIn delay={300} direction="up">
                            <div className="flex flex-col group h-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-300" />
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 border border-emerald-200/50 shadow-inner">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3 drop-shadow-sm">Direct Calendar <span className="text-emerald-600 border-b-2 border-emerald-200">Booking</span></h3>
                                <p className="text-slate-600 font-medium text-[14px] md:text-[15px] leading-relaxed">Once qualified, the AI presents available slots directly from your Google calendar and locks in the meeting seamlessly. <strong className="text-slate-900">Zero back-and-forth.</strong></p>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* --- REAL SOCIAL PROOF SECTION (Lesson 5) --- */}
            <section className="w-full py-16 md:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-5">
                    <FadeIn>
                        <div className="bg-slate-900 rounded-3xl p-6 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative border border-slate-800 flex flex-col md:flex-row items-center gap-8 md:gap-10">
                            {/* Background gradient */}
                            <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-l from-[var(--primary)]/20 to-transparent pointer-events-none -z-10 blur-xl" />

                            <div className="w-full md:w-1/3 flex flex-col items-start">
                                <div className="flex items-center gap-1 mb-3 md:mb-4 drop-shadow-md">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 md:w-5 h-4 md:h-5 text-amber-500 fill-current" />)}
                                </div>
                                <h2 className="text-[1.35rem] md:text-3xl font-bold text-white tracking-tight mb-2">Real results.</h2>
                                <p className="text-slate-400 font-medium text-[14px] md:text-base">Our AI has successfully handled over <strong className="text-white">100,000+ local lead conversations</strong> across the country.</p>
                            </div>

                            <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-slate-700 pt-8 md:pt-0 md:pl-10">
                                <p className="text-base md:text-xl text-slate-200 font-medium italic leading-relaxed mb-6 drop-shadow-sm">
                                    "Before LaunchPath, I was losing at least 3-4 roofing quotes a week because I couldn't answer the phone while on a ladder. Now, the AI texts them instantly, qualifies the job scope, and books the roof inspection for me. My close rate jumped 40%."
                                </p>
                                <div className="flex items-center gap-4">
                                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=MarcusT" alt="Marcus T" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] border-slate-700 bg-slate-800 shadow-lg" />
                                    <div>
                                        <p className="text-white font-bold text-[15px] md:text-base drop-shadow-sm">Marcus Thompson</p>
                                        <p className="text-slate-400 text-[12px] md:text-sm font-medium">Owner, Apex Roofing Solutions <span className="hidden sm:inline">· Verified GMB</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* --- FAQ SECTION --- */}
            <section className="w-full py-12 md:py-16 px-5 max-w-4xl mx-auto mb-10 md:mb-16">
                <div className="mb-10 md:mb-12 text-center md:text-left">
                    <FadeIn>
                        <h2 className="text-[1.75rem] md:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2 md:mb-3 drop-shadow-sm">Clear up any doubts.</h2>
                        <p className="text-slate-600 font-medium md:text-lg">We know you might be skeptical. Read these first.</p>
                    </FadeIn>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <FadeIn key={idx} delay={50 * idx} direction="up">
                            {/* Fixed Flatness with subtle shadow and border layout */}
                            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.05)] transition-all">
                                <button
                                    className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left focus:outline-none"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className={`font-bold text-[15px] md:text-[17px] pr-4 drop-shadow-sm ${openFaq === idx ? 'text-[var(--primary)]' : 'text-slate-800'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-inner ${openFaq === idx ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                                    </div>
                                </button>
                                <div
                                    className={`px-5 md:px-6 text-slate-600 font-medium text-[14px] md:text-[15px] leading-relaxed transition-all duration-300`}
                                    style={{
                                        maxHeight: openFaq === idx ? "150px" : "0",
                                        paddingBottom: openFaq === idx ? "20px" : "0",
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
            <footer className="w-full bg-[#0F172A] py-8 md:py-10 px-5 text-center mt-auto border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 opacity-80 mb-2 md:mb-3 hover:opacity-100 transition-opacity">
                        <span className="text-[12px] md:text-[13px] font-medium text-slate-400">Powered by</span>
                        <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-[var(--primary)] flex items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.3)]">
                            <Zap className="w-[10px] h-[10px] md:w-3 md:h-3 text-white fill-current drop-shadow-md" />
                        </div>
                        <span className="text-[14px] md:text-[15px] font-bold tracking-tight text-white drop-shadow-sm">LaunchPath.</span>
                    </div>

                    <p className="text-[11px] md:text-sm text-slate-500 font-medium mt-1 md:mt-2">
                        © {new Date().getFullYear()} LaunchPath Inc. All rights reserved. | Demo purposes only.
                    </p>
                </div>
            </footer>

        </div>
    );
}
