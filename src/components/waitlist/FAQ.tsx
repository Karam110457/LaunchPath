"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackWaitlistEvent } from "@/lib/analytics";

const ITEMS = [
  {
    question: "Is this a course or a software tool?",
    answer: "LaunchPath is a guided software experience. You answer a few questions and get three concrete outputs: a validated offer one-pager, a step-by-step build plan (tools and templates), and a sales pack (scripts and outreach). It’s not a video course; it’s an interactive flow that produces artifacts you can use immediately.",
  },
  {
    question: "Do I need to know how to code?",
    answer: "No. We assume you’re an AI beginner. The build plans use no-code and low-code options (e.g. Make, Zapier, ChatGPT, simple prompts). If you can follow steps and copy-paste, you can build what we recommend.",
  },
  {
    question: "What if I don't have an idea yet?",
    answer: "We have a dedicated path for that. Choose “I need direction” and the system uses your goals, time, and comfort level to recommend one offer, one buyer type, and one delivery model. You get a single recommendation first; you can refine from there.",
  },
  {
    question: "Is this 'get rich quick'?",
    answer: "No. We focus on building one sellable system and getting to your first real conversation or client. That takes consistent effort. We give you the structure so you don’t waste time on the wrong niche or build.",
  },
  {
    question: "When will I get access?",
    answer: "We open in small batches. Joining the waitlist puts you in line. You’ll get an email when it’s your turn. We don’t share an exact date so we can keep quality high.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="font-serif italic text-3xl md:text-4xl text-white mb-4">
            Common Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know before joining.
          </p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4"
          onValueChange={(value) => {
            if (value) trackWaitlistEvent("faq_opened", { question_id: value });
          }}
        >
          {ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-white/10 bg-white/[0.02] rounded-xl px-6"
            >
              <AccordionTrigger className="text-white hover:text-primary transition-colors text-left text-lg py-6 min-h-[44px] [&[data-state=open]>svg]:rotate-180">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
