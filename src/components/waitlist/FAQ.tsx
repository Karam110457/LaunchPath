import { Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  return (
    <section id="faq" className="py-24 border-t border-white/5 bg-[#0a0a0a]">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="font-serif italic text-3xl md:text-4xl text-white mb-4">
            Common Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know before joining.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {[
            {
              question: "Is this a course or a software tool?",
              answer: "It's a guided software experience. Unlike a static course, LaunchPath is an interactive builder that takes your inputs and generates specific outputs: your offer, your build plan, and your sales scripts. It combines the education of a course with the utility of a tool."
            },
            {
              question: "Do I need to know how to code?",
              answer: "No. LaunchPath is designed for 'AI beginners'. We focus on no-code and low-code tools (like Make, Zapier, and prompting) to help you build sellable systems without needing to be a software engineer."
            },
            {
              question: "What if I don't have an idea yet?",
              answer: "That's exactly what we solve. We have a specific 'I need direction' path that analyzes your skills and goals to recommend a sellable offer, buyer persona, and delivery model before you start building."
            },
            {
              question: "Is this 'get rich quick'?",
              answer: "Absolutely not. We focus on competence, not hype. Our goal is to help you build a real, sellable asset. It takes work, but we provide the map so you don't waste time on the wrong things."
            },
            {
              question: "When will I get access?",
              answer: "We are opening access in small batches to ensure every user gets a high-quality experience. Joining the waitlist today secures your spot in line for the next release."
            }
          ].map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border border-white/5 bg-white/[0.02] rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-primary transition-colors text-left text-lg py-6 [&[data-state=open]>svg]:rotate-45">
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
