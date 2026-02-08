import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Privacy Policy — LaunchPath",
  description: "LaunchPath privacy policy: how we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
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
        <h1 className="font-serif font-light text-3xl md:text-4xl text-white mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: February 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Introduction</h2>
            <p>
              LaunchPath (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the LaunchPath service, a guided software experience that helps users create sellable AI offers, build plans, and sales packs. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services, including when you join our waitlist or use our product.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Information We Collect</h2>
            <p className="mb-2">We may collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Account and waitlist data:</strong> email address, and any optional information you provide (e.g., your stage, goals, or blockers) when you sign up for the waitlist or create an account.</li>
              <li><strong className="text-foreground">Usage and product data:</strong> how you use our service (e.g., inputs you provide, artifacts you generate) to improve our product and support you.</li>
              <li><strong className="text-foreground">Technical data:</strong> IP address, browser type, device information, and similar technical data that we may use for security, analytics, and operation of our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Provide, maintain, and improve the LaunchPath service.</li>
              <li>Communicate with you (e.g., waitlist updates, product access, and important notices).</li>
              <li>Personalize your experience and tailor outputs (e.g., offer blueprints, build plans) to your inputs.</li>
              <li>Analyze usage to improve our product and understand how people use LaunchPath.</li>
              <li>Comply with legal obligations and protect our rights and the security of our systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share your information only: (a) with service providers who assist us in operating our service (e.g., hosting, email, analytics), under strict confidentiality; (b) when required by law or to protect our rights, safety, or property; or (c) in connection with a merger, sale, or transfer of assets, with notice where required.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Data Retention and Security</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the service, comply with law, or resolve disputes. We implement appropriate technical and organizational measures to protect your data against unauthorized access, loss, or misuse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have the right to access, correct, delete, or port your personal data, or to object to or restrict certain processing. You can contact us at the email below to exercise these rights. You may also unsubscribe from marketing emails at any time via the link in our emails.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Cookies and Similar Technologies</h2>
            <p>
              We may use cookies and similar technologies for essential operation, security, and to understand how you use our site. You can adjust your browser settings to limit or block cookies, though some features may not work as intended.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Children</h2>
            <p>
              Our service is not directed to individuals under 16. We do not knowingly collect personal information from children under 16. If you believe we have collected such information, please contact us so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated policy on this page and update the &quot;Last updated&quot; date. Continued use of the service after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our practices, contact us at:{" "}
              <a href="mailto:privacy@launchpath.com" className="text-primary hover:underline">privacy@launchpath.com</a> (or the contact email we publish on our website).
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
