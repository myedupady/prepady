import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export const metadata: Metadata = { title: 'Terms of Service — Prepady' }

const UPDATED = '12 October 2026'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" /> Prepady<span className="text-gold-500">.</span>
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {UPDATED}</p>

        <div className="space-y-6 text-ink-900 text-[15px] leading-relaxed">
          <p>These terms govern your use of Prepady. By creating an account or using the service, you agree to them.</p>

          <Section title="Your account">
            <p>You are responsible for keeping your login details secure and for activity under your account. Provide accurate information and keep it up to date. You must be old enough to use the service under applicable law, with appropriate consent where required.</p>
          </Section>

          <Section title="Acceptable use">
            <ul className="list-disc pl-5 space-y-1">
              <li>Use Prepady for personal, lawful study purposes.</li>
              <li>Do not misuse the service, attempt to disrupt it, scrape content at scale, or abuse the AI features.</li>
              <li>Do not resell or redistribute question content or explanations without permission.</li>
            </ul>
          </Section>

          <Section title="Content & accuracy">
            <p>Practice questions, explanations, and AI-generated or AI-marked responses are provided to aid study and may contain errors. They are not a guarantee of exam outcomes. Always verify against official syllabi and marking schemes.</p>
          </Section>

          <Section title="Subscriptions & payments">
            <p>Some features may require a paid subscription. Pricing and what each plan includes are shown in the app. Where payments apply, they are handled by our payment provider; applicable terms and any refund policy will be presented at purchase.</p>
          </Section>

          <Section title="Intellectual property">
            <p>Prepady and its content are owned by us or our licensors. We grant you a limited, non-transferable right to use the service for your own study. Content you submit remains yours; you grant us the rights needed to operate the service.</p>
          </Section>

          <Section title="Availability & changes">
            <p>We may update, suspend, or discontinue features. We aim for reliable service but do not guarantee uninterrupted availability.</p>
          </Section>

          <Section title="Disclaimers & liability">
            <p>The service is provided “as is” without warranties of any kind. To the extent permitted by law, we are not liable for indirect or consequential losses arising from use of the service.</p>
          </Section>

          <Section title="Termination">
            <p>You may stop using Prepady at any time. We may suspend or terminate accounts that breach these terms or misuse the service.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about these terms? Contact us at <b>support@prepady.com</b>.</p>
          </Section>

          <p className="text-xs text-muted-foreground border-t border-border pt-4">These terms are a general template for an MVP and should be reviewed by the organisation (and, where appropriate, legal counsel) before public launch.</p>
        </div>

        <p className="mt-8"><Link href="/privacy" className="text-sm font-semibold text-gold-700 hover:text-gold-800">Privacy Policy →</Link></p>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-extrabold text-ink-900 mb-2">{title}</h2>
      {children}
    </section>
  )
}
