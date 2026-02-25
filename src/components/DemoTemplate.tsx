"use client";

import React, { useState } from "react";
import { AlertTriangle, ChevronDown, Check } from "lucide-react";

// --- TYPES ---
export interface DemoConfig {
    logoText?: string;
    headline?: string;
    subheadline?: string;
    faq?: { question: string; answer: string }[];
}

export default function DemoTemplate({ config }: { config?: DemoConfig }) {
    // We'll use a local fallback CSS variable in case it isn't set globally.
    // The primary color from the images is a matte green, like #1e874b.

    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [isConsentChecked, setIsConsentChecked] = useState(false);

    const faqs = config?.faq || [
        {
            question: "How does the WhatsApp AI Agent actually work?",
            answer: "It connects directly to your WhatsApp Business account and uses AI to chat with leads in real-time, qualifying them, answering FAQs, and booking calls automatically."
        },
        {
            question: "Do I need technical skills to set it up?",
            answer: "Not at all. We set everything up for you, including the flows, questions, integrations, and calendar. You don't touch a line of code."
        },
        {
            question: "Can it integrate with my CRM?",
            answer: "Yes. It can push lead data to your CRM so everything stays organized and ready for follow-up. You can see all the conversation and data points in your CRM."
        },
        {
            question: "Can the AI handle after-hours inquiries?",
            answer: "Yes, our AI operates 24/7, ensuring you never miss a lead, even outside of normal business hours."
        },
        {
            question: "Can it book appointments into my calendar?",
            answer: "Absolutely. We integrate seamlessly with your existing calendar software to seamlessly book qualified appointments without conflicts."
        }
    ];

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-white font-sans selection:bg-[var(--primary)]/30 flex flex-col font-medium">
            {/* Inject variables specifically for this demo if not provided by wrapper */}
            <style dangerouslySetInnerHTML={{
                __html: `
        :root {
          --primary: #1e874b;
        }
      `}} />

            {/* --- ATTENTION BANNER --- */}
            <div className="w-full bg-[var(--primary)] text-white py-2 flex items-center justify-center gap-2 text-[13px] md:text-sm font-bold tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                ATTENTION: GET TOP-TIER WORK COMPLETED ON TIME
            </div>

            {/* --- HERO & FORM SECTION --- */}
            <main className="flex-grow flex flex-col items-center px-4 pt-12 pb-24 max-w-4xl mx-auto w-full">

                {/* Logo Placeholder */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[3px] border-white rounded-lg flex items-center justify-center rotate-[15deg]">
                            <div className="w-4 h-4 bg-white rotate-[-15deg] rounded-sm"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-extrabold tracking-tight text-white leading-none">clientacquisition</span>
                            <span className="text-[10px] tracking-[0.2em] text-zinc-400 font-bold mt-1 uppercase text-center block w-full">Roofing & Remodeling</span>
                        </div>
                    </div>
                </div>

                {/* Headlines */}
                <div className="text-center mb-12 space-y-4 max-w-3xl">
                    <h1 className="text-3xl md:text-[44px] font-bold tracking-tight text-white leading-[1.2]">
                        <span style={{ color: "var(--primary)" }}>30+ Homeowners</span> Trust Us Each Month<br />
                        Get Fast, Reliable <span style={{ color: "var(--primary)" }}>Roofing & Remodeling</span><br />
                        with Stunning Results!
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-300 font-medium">
                        Our Voice & Chat AI Assistants are Available 24/7 to Talk!
                    </p>
                </div>

                {/* Lead Form Card */}
                <div className="w-full max-w-[550px] border border-[var(--primary)] rounded-[12px] p-6 md:p-10 bg-[#1f1f1f] shadow-2xl relative z-10">
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>

                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-white pl-1 tracking-wide">First Name</label>
                            <input
                                type="text"
                                placeholder="First Name"
                                className="w-full bg-white text-black rounded-lg px-4 py-3 text-[15px] font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-white pl-1 tracking-wide">Last Name</label>
                            <input
                                type="text"
                                placeholder="Last Name"
                                className="w-full bg-white text-black rounded-lg px-4 py-3 text-[15px] font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-white pl-1 tracking-wide">Phone *</label>
                            <input
                                type="tel"
                                placeholder="Phone"
                                className="w-full bg-white text-black rounded-lg px-4 py-3 text-[15px] font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[13px] font-bold text-white pl-1 tracking-wide">Email *</label>
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full bg-white text-black rounded-lg px-4 py-3 text-[15px] font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-shadow"
                            />
                        </div>

                        {/* Consent Checkbox */}
                        <div className="flex items-start gap-3 mt-6 pt-3 pb-2">
                            <button
                                type="button"
                                className={`mt-0.5 w-4 h-4 rounded-sm flex shrink-0 items-center justify-center transition-colors border ${isConsentChecked ? "bg-white border-white text-black" : "bg-white border-white"
                                    }`}
                                onClick={() => setIsConsentChecked(!isConsentChecked)}
                            >
                                {isConsentChecked && <Check className="w-3.5 h-3.5 text-black" strokeWidth={4} />}
                            </button>
                            <p className="text-[12px] text-white leading-relaxed font-semibold pr-2">
                                By checking this box, I consent to receive transactional messages related to my account, orders, or services I have requested. These messages may include appointment reminders, order confirmations, and account notifications among others. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                className="w-full py-4 rounded-lg font-bold text-white text-[15px] transition-colors duration-300 hover:brightness-110"
                                style={{ backgroundColor: "var(--primary)" }}
                            >
                                Submit
                            </button>
                        </div>

                        <div className="text-center pt-5 pb-1 flex items-center justify-center gap-1.5">
                            <a href="#" className="text-[13px] font-medium transition-colors" style={{ color: "#3b82f6" }}>Privacy Policy</a>
                            <span className="text-zinc-500 text-xs">|</span>
                            <a href="#" className="text-[13px] font-medium transition-colors" style={{ color: "#3b82f6" }}>Terms of Service</a>
                        </div>

                    </form>
                </div>
            </main>

            {/* --- FAQ SECTION --- */}
            <section className="bg-gradient-to-b from-[#18291f] to-[#0e1712] pt-24 pb-20 px-4">
                <div className="max-w-[700px] mx-auto w-full">
                    <div className="text-center mb-12">
                        <h3 className="text-[13px] font-bold tracking-[0.2em] mb-4 text-white uppercase opacity-90">STILL GOT QUESTIONS?</h3>
                        <h2 className="text-4xl md:text-[44px] font-bold text-white tracking-tight">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-xl overflow-hidden transition-all duration-200"
                            >
                                <button
                                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className="font-bold text-black text-[17px] pr-4">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-black shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} />
                                </button>
                                <div
                                    className={`px-6 text-zinc-700 text-[15px] leading-relaxed overflow-hidden transition-all duration-300`}
                                    style={{
                                        maxHeight: openFaq === idx ? "200px" : "0",
                                        paddingBottom: openFaq === idx ? "20px" : "0"
                                    }}
                                >
                                    <p className="pt-2">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- BOTTOM CTA --- */}
            <section className="bg-gradient-to-b from-[#0e1712] to-[#0a100d] pt-24 pb-32 px-4 text-center">
                <div className="max-w-[850px] mx-auto">
                    <h2 className="text-3xl md:text-[44px] font-bold text-white mb-6 leading-[1.2] tracking-tight">
                        Ready to Let WhatsApp AI Book Your<br className="hidden md:block" /> Appointments?
                    </h2>
                    <p className="text-[17px] text-white mb-10 leading-relaxed font-normal max-w-[800px] mx-auto opacity-90">
                        Imagine waking up to a calendar full of confirmed appointments, all booked automatically through WhatsApp. Our AI Setter chats with your leads, qualifies them, and books the job while you sleep. No stress. No chasing. Just real bookings on autopilot. Click below to test it for your business, no risk, no commitment.
                    </p>

                    <button
                        className="w-full sm:w-auto px-10 py-5 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-2xl flex flex-col items-center justify-center mx-auto"
                        style={{ backgroundColor: "var(--primary)" }}
                    >
                        <span className="font-bold text-black text-xl mb-0.5">Click To Experience The Agent</span>
                        <span className="text-black/70 text-[13px] font-bold">Try Our AI Agent Live On Your WhatsApp</span>
                    </button>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-[#0a100d] py-12 px-4 text-center">
                <div className="max-w-[900px] mx-auto flex flex-col items-center">
                    <div className="flex items-center justify-center gap-3 mb-8 w-full">
                        <div className="w-8 h-8 border-[3px] border-white rounded-lg flex items-center justify-center rotate-[15deg]">
                            <div className="w-3 h-3 bg-white rotate-[-15deg] rounded-sm"></div>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">clientacquisition.io</span>
                    </div>
                    <p className="text-[12px] text-white/50 max-w-[800px] leading-relaxed mb-6 font-medium">
                        This site is not a part of the Facebook website or Facebook Inc. Additionally, This site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of FACEBOOK, Inc.
                    </p>
                    <p className="text-[13px] text-white font-bold opacity-90">
                        © {new Date().getFullYear()} All Rights Reserved | Privacy Policy | Terms of Service
                    </p>
                </div>
            </footer>
        </div>
    );
}
