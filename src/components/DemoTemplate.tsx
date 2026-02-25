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
        <div className="min-h-screen bg-[#FDFDFD] text-[#0F172A] font-sans selection:bg-[#4F46E5] selection:text-white flex flex-col justify-start w-full relative overflow-x-hidden">

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
          opacity: 0.02;
          pointer-events: none;
        }
      `}} />

            {/* --- ATTENTION ANNOUNCEMENT BAR --- */}
            <div className="w-full bg-[var(--primary)] text-white text-center py-2.5 px-4 text-xs sm:text-sm font-medium z-50 relative shadow-md flex items-center justify-center">
                <span className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span><strong className="font-extrabold hidden sm:inline">Limited Availability:</strong> Accepting 5 new local business partners this week.</span>
                </span>
            </div>

            {/* --- BACKGROUND FX --- */}
            <div className="absolute inset-0 bg-noise z-0 mix-blend-overlay mt-10" />
            <div className="absolute top-10 right-0 w-[50vw] h-[500px] bg-[var(--primary)]/5 blur-[120px] rounded-bl-full pointer-events-none -z-10" />

            {/* NO NAVIGATION BAR - One page, One action (Lesson 7: Focus) */}

            {/* --- HERO SPLIT (Mobile Visual Hierarchy Optimized) --- */}
            {/* Used CSS Grid to ensure the Form (Col 2) drops neatly below the Headline (Col 1, Row 1) but ABOVE the Agitation/Social Proof (Col 1, Row 2) on mobile. */}
            <main className="w-full max-w-6xl mx-auto px-5 pt-8 pb-16 md:pt-16 md:pb-24 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 gap-y-10 relative z-10">

                {/* ROW 1 LEFT: HEADLINE (Always visible first) */}
                <div className="flex flex-col justify-start lg:pr-4">
                    {/* 5. Borrowed Social Proof / Industry Stat (For new agencies) */}
                    <FadeIn>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex -space-x-2 opacity-80">
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm"><Zap className="w-4 h-4 fill-current" /></div>
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm"><Clock className="w-4 h-4" /></div>
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm"><ShieldCheck className="w-4 h-4" /></div>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-current" />)}
                                </div>
                                <span className="text-[13px] md:text-sm">Instant response increases bookings by <strong className="text-slate-900">up to 391%*</strong></span>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={100}>
                        {/* 1. Benefit-Driven Headline: Unified outome and mechanism */}
                        <h1 className="text-[2.8rem] sm:text-[3.2rem] md:text-[3.8rem] font-extrabold tracking-tighter text-[#0F172A] leading-[1.05] mb-5">
                            Turn Missed Calls Into <span className="text-[var(--primary)] inline-block relative">Booked Jobs<svg className="absolute w-full h-3 -bottom-1 left-0 text-[var(--primary)]/30" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" /></svg></span> With AI.
                        </h1>
                    </FadeIn>

                    <FadeIn delay={150}>
                        {/* 1. Sub-headline: USP hook emphasized */}
                        <p className="text-lg md:text-xl text-slate-600 mb-2 max-w-xl leading-relaxed">
                            <strong className="text-slate-900 font-bold block mb-1.5 text-[1.1rem] md:text-[1.25rem]">Experience our AI answering your phones live right now.</strong>
                            It takes exactly <span className="font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded">60 seconds</span> to try the interactive demo below.
                        </p>
                    </FadeIn>
                </div>

                {/* RIGHT (or direct center on Mobile): THE CONVERSION FORM (Lesson 6: Visual Hierarchy) */}
                {/* Spans 2 rows on large screens so it sits adjacent to both the headline AND the social proof below it. */}
                <div className="lg:row-span-2 relative w-full lg:max-w-md xl:max-w-lg mx-auto lg:mx-0 lg:ml-auto" id="demo-start">
                    <FadeIn delay={150} direction="left">

                        <div className="bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-200 relative overflow-hidden flex flex-col">

                            {/* Form Header */}
                            <div className="bg-slate-50 border-b border-slate-100 p-6 md:px-8 py-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Experience Your 60-Second Demo</h3>
                                    <p className="text-[13px] md:text-sm font-medium text-slate-500 mt-0.5">Tell us about your business so the AI can tailor the conversation.</p>
                                </div>
                                <div className="w-10 h-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center shrink-0">
                                    <PlayCircle className="w-5 h-5" fill="currentColor" stroke="white" />
                                </div>
                            </div>

                            {/* Dynamic State: Form vs Success */}
                            {!isSuccess ? (
                                <form className="p-6 md:p-8 space-y-4 md:space-y-5 flex-grow" onSubmit={handleDemoSubmit}>

                                    {/* Minimized Fields - Max 4 (Lesson 7: Simplicity) */}
                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-slate-700">Business Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.businessName}
                                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                            placeholder="e.g. Acme Plumbing"
                                            className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[13px] font-bold text-slate-700">What service do you provide?</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.industry}
                                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl pl-4 pr-10 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium appearance-none focus:outline-none focus:border-[var(--primary)] focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-sm"
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
                                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-sm"
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
                                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 md:py-3.5 min-h-[44px] md:min-h-[48px] text-[15px] md:text-[16px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[var(--primary)] focus:ring-[3px] focus:ring-[var(--primary)]/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* High Trust Consent */}
                                    <div className="flex items-start gap-3 md:mt-2 pt-2 pb-2">
                                        <button
                                            type="button"
                                            className={`mt-0.5 min-w-[20px] min-h-[20px] w-5 h-5 rounded-md flex shrink-0 items-center justify-center transition-all border shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${isConsentChecked ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-white border-slate-300 hover:border-slate-400"
                                                }`}
                                            onClick={() => setIsConsentChecked(!isConsentChecked)}
                                        >
                                            {isConsentChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
                                        </button>
                                        <p className="text-[11px] md:text-[12px] text-slate-500 font-medium leading-[1.5]">
                                            I consent to receive a one-time live demo text to the number above. Reply STOP to end.
                                        </p>
                                    </div>

                                    {/* 1. Large Contrasting CTA Button (Lesson 6: Visual Hierarchy) */}
                                    <button
                                        disabled={isSubmitting || !isConsentChecked}
                                        className="w-full py-4.5 md:py-4.5 rounded-xl font-bold flex items-center justify-center transition-all duration-300 shadow-[0_10px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.35)] active:scale-[0.98] mt-2 min-h-[56px] md:min-h-[60px] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                                        style={{ backgroundColor: "var(--primary)" }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                        <span className="text-white text-[16px] md:text-[19px] relative z-10">
                                            {isSubmitting ? "Connecting to AI..." : "Start My Free Demo Now"}
                                        </span>
                                    </button>

                                    {/* FUD Reducer explicitly under CTA (Lesson 1) */}
                                    <div className="text-center w-full mt-3 space-y-1.5 px-2">
                                        <p className="text-[12px] md:text-[13px] font-bold text-slate-700 flex items-center justify-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Free Demo. No commitment.</p>
                                        <p className="text-[11px] md:text-[12px] text-slate-500 font-medium leading-tight text-balance">We will never spam you. Your details are securely used <strong className="text-slate-600">only once</strong> to run this personalized live demonstration.</p>
                                    </div>

                                </form>
                            ) : (
                                // --- POST FORM EXPERIENCE (The Magic Moment) ---
                                <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center flex-grow bg-slate-50/50">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                                        <Check className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" strokeWidth={4} />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">The AI is texting you now.</h3>
                                    <p className="text-slate-600 font-medium text-base md:text-lg mb-8">
                                        <strong className="text-slate-900">{formData.name || "There"}</strong>, please check your mobile device at <strong className="text-slate-900">{formData.phone}</strong>.
                                    </p>

                                    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 text-left w-full shadow-sm">
                                        <p className="text-slate-800 font-bold text-[15px] md:text-base mb-3 flex items-center gap-2"><Zap className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-current" /> Next Steps to experience the power:</p>
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

                {/* ROW 2 LEFT: AGITATION & SOCIAL PROOF (Sits below the form on mobile) */}
                <div className="flex flex-col justify-start lg:pr-4">
                    {/* 2. Emotional Agitation / PAS Framework (Lesson 2) */}
                    <FadeIn delay={250}>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 md:p-6 max-w-lg relative shadow-sm">
                            <div className="absolute -left-2 top-6 w-1 h-12 bg-rose-500 rounded-r-md"></div>
                            <p className="text-[14px] md:text-[15px] text-slate-700 leading-relaxed font-medium">
                                <strong className="text-slate-900 block mb-1">We know the feeling:</strong>
                                You're working a job site, you miss a call, and lose the lead to voicemail. By the time you call them back 3 hours later, <strong className="text-slate-900">they've already paid your competitor</strong> who answered immediately.
                            </p>
                        </div>
                    </FadeIn>
                </div>

            </main>

            {/* --- SCANNABLE VALUE PROP / HOW IT WORKS (Lesson 4: People Scan, They Don't Read & Lesson 3) --- */}
            <section className="w-full bg-[#f8fafc] py-16 md:py-28 border-y border-slate-200 shadow-sm relative z-0 mt-8 md:mt-0">
                <div className="max-w-6xl mx-auto px-5">
                    <div className="text-center md:text-left mb-12 md:mb-16 max-w-2xl">
                        <FadeIn>
                            {/* 4. Bold Benefit-Driven Headline (Instead of "How it works") */}
                            <h2 className="text-[1.75rem] md:text-[2.5rem] font-extrabold tracking-tight text-[#0F172A] mb-4 leading-tight">Three things it handles while you're on the job.</h2>
                            <p className="text-slate-600 md:text-lg font-medium">Your business doesn't stop, so neither should your reception. Here is exactly what the system achieves for you in the background.</p>
                        </FadeIn>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12 text-left">
                        <FadeIn delay={100} direction="up">
                            <div className="flex flex-col group h-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
                                    <PlayCircle className="w-6 h-6" />
                                </div>
                                {/* Formatting for scanning: Bold core value */}
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3"><span className="text-[var(--primary)] text-bold">Sub-second</span> Engagement</h3>

                                <p className="font-bold text-slate-900 text-[15px] mb-2 leading-snug">Hook prospects before they call your competitors.</p>
                                <p className="text-slate-600 font-medium text-[14px] leading-relaxed mb-6">When a prospect texts you, the AI replies instantly. It starts a polite conversation the moment their text hits your number.</p>

                                <div className="mt-auto bg-slate-50 border border-slate-100 rounded-lg p-3 text-[13px] font-bold text-slate-700 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-blue-500 fill-blue-500" /> Average response time: 0.8 seconds
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={200} direction="up">
                            <div className="flex flex-col group h-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 border border-amber-100">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3"><span className="text-[var(--primary)] text-bold">Ruthless</span> Qualification</h3>

                                <p className="font-bold text-slate-900 text-[15px] mb-2 leading-snug">Stop wasting time on dead-end tire kickers.</p>
                                <p className="text-slate-600 font-medium text-[14px] leading-relaxed mb-6">It asks the budget, timeline, and scope questions you require. If they aren't a fit, it politely turns them away so you only talk to perfect leads.</p>

                                <div className="mt-auto bg-slate-50 border border-slate-100 rounded-lg p-3 text-[13px] font-bold text-slate-700 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-amber-500 fill-amber-500" /> Only 1 in 4 leads makes it to your calendar
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={300} direction="up">
                            <div className="flex flex-col group h-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 border border-emerald-100">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Direct Calendar <span className="text-[var(--primary)] text-bold">Booking</span></h3>

                                <p className="font-bold text-slate-900 text-[15px] mb-2 leading-snug">Wake up to qualified jobs ready on your schedule.</p>
                                <p className="text-slate-600 font-medium text-[14px] leading-relaxed mb-6">Once perfectly qualified, the AI presents available slots directly from your Google calendar and locks in the meeting seamlessly.</p>

                                <div className="mt-auto bg-slate-50 border border-slate-100 rounded-lg p-3 text-[13px] font-bold text-slate-700 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-emerald-500 fill-emerald-500" /> 100% automated. Zero back-and-forth.
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* --- INDUSTRY STAT PROOF SECTION (Lesson 5 Alternative for New Agencies) --- */}
            <section className="w-full py-16 md:py-20 bg-white">
                <div className="max-w-6xl mx-auto px-5">
                    <FadeIn>
                        <div className="bg-slate-900 rounded-3xl p-6 md:p-12 shadow-2xl overflow-hidden relative border border-slate-800 flex flex-col md:flex-row items-center gap-8 md:gap-10">
                            {/* Background gradient */}
                            <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-l from-[var(--primary)]/20 to-transparent pointer-events-none -z-10 blur-xl" />

                            <div className="w-full md:w-1/3 flex flex-col items-start">
                                <div className="flex items-center gap-1 mb-3 md:mb-4">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 md:w-5 h-4 md:h-5 text-amber-500 fill-current" />)}
                                </div>
                                <h2 className="text-[1.35rem] md:text-3xl font-bold text-white tracking-tight mb-2">The data doesn't lie.</h2>
                                <p className="text-slate-400 font-medium text-[14px] md:text-base">Why Fortune 500 companies rely on <strong className="text-white">sub-second AI response</strong> architecture.</p>
                            </div>

                            <div className="w-full md:w-2/3 border-t md:border-t-0 md:border-l border-slate-700 pt-8 md:pt-0 md:pl-10">
                                <p className="text-base md:text-xl text-slate-200 font-medium italic leading-relaxed mb-6">
                                    "Industry data shows that 78% of customers buy from the company that responds to their inquiry first. By deploying a conversational AI that responds in under 5 minutes, businesses see a <strong className="text-[var(--primary)] font-bold">391% increase</strong> in conversion rates from lead to booked appointment."
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-700 bg-slate-800 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-white font-black text-xs md:text-sm tracking-tighter">HBR</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-[15px] md:text-base mb-0.5">Lead Response Management Study</p>
                                        <p className="text-slate-400 text-[12px] md:text-sm font-medium">As featured in Harvard Business Review</p>
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
                        <h2 className="text-[1.75rem] md:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2 md:mb-3">Clear up any doubts.</h2>
                        <p className="text-slate-600 font-medium md:text-lg">We know you might be skeptical. Read these first.</p>
                    </FadeIn>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <FadeIn key={idx} delay={50 * idx} direction="up">
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <button
                                    className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left focus:outline-none"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className={`font-bold text-[15px] md:text-[17px] pr-4 ${openFaq === idx ? 'text-[var(--primary)]' : 'text-slate-800'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${openFaq === idx ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-slate-50 text-slate-400'}`}>
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
            <footer className="w-full bg-[#0F172A] py-8 md:py-10 px-5 text-center mt-auto">
                <div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 opacity-80 mb-2 md:mb-3 hover:opacity-100 transition-opacity">
                        <span className="text-[12px] md:text-[13px] font-medium text-slate-400">Powered by</span>
                        <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-[var(--primary)] flex items-center justify-center">
                            <Zap className="w-[10px] h-[10px] md:w-3 md:h-3 text-white fill-current" />
                        </div>
                        <span className="text-[14px] md:text-[15px] font-bold tracking-tight text-white">LaunchPath.</span>
                    </div>

                    <p className="text-[11px] md:text-sm text-slate-500 font-medium mt-1 md:mt-2">
                        © {new Date().getFullYear()} LaunchPath Inc. All rights reserved. | Demo purposes only.
                    </p>
                </div>
            </footer>

        </div>
    );
}
