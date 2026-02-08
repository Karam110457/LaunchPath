import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Terms of Service — LaunchPath",
  description: "LaunchPath terms of service: use of our website and guided software experience.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white hover:opacity-80 transition-opacity">
            <Logo className="text-xl" />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: February 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using LaunchPath (&quot;Service,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), including our website, waitlist, and any guided software experience we provide (e.g., offer blueprints, build plans, sales packs), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
            <p>
              LaunchPath is a guided software experience that helps users—particularly AI beginners—move from idea to a first sellable AI offer. The Service may include: collecting your goals and inputs, generating outputs such as offer one-pagers, step-by-step build plans, and sales packs, and related tools (e.g., validation, competitor analysis). We may offer early access via a waitlist and may update or discontinue features at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Eligibility and Account</h2>
            <p>
              You must be at least 16 years old and able to form a binding contract to use the Service. When you sign up (e.g., for the waitlist or an account), you agree to provide accurate information and to keep it updated. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Use the Service for any illegal purpose or in violation of any laws.</li>
              <li>Attempt to gain unauthorized access to our systems, other accounts, or any data not intended for you.</li>
              <li>Transmit malware, spam, or any content that is harmful, abusive, or infringes others&apos; rights.</li>
              <li>Scrape, reverse engineer, or automate access to the Service in a way that burdens our systems or violates these Terms.</li>
              <li>Resell or redistribute the Service or our outputs in a manner that competes with us or misrepresents the source.</li>
            </ul>
            <p className="mt-2">
              We may suspend or terminate your access if we believe you have violated these terms or for any other reason we deem necessary to protect the Service or others.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Your Content and Our Outputs</h2>
            <p>
              You retain ownership of the inputs you provide (e.g., ideas, goals). By using the Service, you grant us a license to use, process, and store that content as necessary to provide and improve the Service. Outputs we generate (e.g., offer blueprints, build plans) are provided for your use in accordance with these Terms. We do not guarantee that outputs are error-free, complete, or suitable for any particular business or legal purpose; you use them at your own risk and are responsible for your own business and legal compliance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Intellectual Property</h2>
            <p>
              LaunchPath and its branding, design, and technology are owned by us or our licensors. These Terms do not grant you any right to our trademarks, code, or other intellectual property except the limited right to use the Service as described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR FREE OF ERRORS, OR THAT OUR OUTPUTS WILL ACHIEVE ANY PARTICULAR BUSINESS OR LEGAL RESULT.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LAUNCHPATH AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM (OR ONE HUNDRED U.S. DOLLARS IF GREATER).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless LaunchPath and its affiliates and their respective officers, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorneys&apos; fees) arising from your use of the Service, your content, or your violation of these Terms or any law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Changes to Terms or Service</h2>
            <p>
              We may modify these Terms or the Service at any time. We will post updated Terms on this page and update the &quot;Last updated&quot; date. Material changes may be communicated via email or a notice in the Service. Continued use after changes constitutes acceptance. If you do not agree, you must stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">11. General</h2>
            <p>
              These Terms constitute the entire agreement between you and LaunchPath regarding the Service. They are governed by the laws of the United States (and the State of Delaware, without regard to conflict of laws). Any dispute shall be resolved in the courts located in Delaware. If any provision is found unenforceable, the remaining provisions remain in effect. Our failure to enforce any right does not waive that right.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">12. Contact</h2>
            <p>
              For questions about these Terms, contact us at:{" "}
              <a href="mailto:legal@launchpath.com" className="text-primary hover:underline">legal@launchpath.com</a> (or the contact email we publish on our website).
            </p>
          </section>
        </div>

        <p className="mt-12 pt-8 border-t border-white/10 text-muted-foreground text-sm">
          <Link href="/" className="text-primary hover:underline">Return to LaunchPath</Link>
        </p>
      </main>
    </div>
  );
}
