import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export const metadata: Metadata = { title: 'Privacy Policy — Prepady' }

const UPDATED = '12 October 2026'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" /> Prepady<span className="text-gold-500">.</span>
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 prose-sm">
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {UPDATED}</p>

        <div className="space-y-6 text-ink-900 text-[15px] leading-relaxed">
          <p>Prepady (“we”, “us”) provides AI-assisted exam-preparation tools for students. This policy explains what we collect, why, and your choices. By using Prepady you agree to this policy.</p>

          <Section title="Information we collect">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Account details</b> — your name and email address when you sign up (including via Google Sign-In, which shares your name, email, and profile picture).</li>
              <li><b>Learning activity</b> — the quizzes you take, answers, scores, and progress, used to adapt practice and show your performance.</li>
              <li><b>Technical data</b> — standard log data (IP address, device/browser) used for security and to prevent abuse.</li>
            </ul>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and personalise practice, explanations, and progress tracking.</li>
              <li>To operate, secure, and improve the service.</li>
              <li>To communicate with you about your account (e.g. password resets, email verification).</li>
            </ul>
          </Section>

          <Section title="AI processing">
            <p>To generate explanations and mark theory answers, question content and your submitted answers may be sent to our AI provider (Anthropic) for processing. We do not send your name or email to the AI provider for this purpose.</p>
          </Section>

          <Section title="Service providers">
            <p>We use trusted providers to run Prepady, including hosting (Vercel), database (Supabase), email (Resend), media storage (Cloudinary), and AI (Anthropic). They process data only to provide their service to us.</p>
          </Section>

          <Section title="Data retention & security">
            <p>We keep your data while your account is active and as needed to provide the service. We use reasonable technical and organisational measures to protect it. No method of transmission or storage is completely secure.</p>
          </Section>

          <Section title="Your choices">
            <p>You can access or update your details in your account, and request deletion of your account and associated data by contacting us. You may stop using Google Sign-In at any time.</p>
          </Section>

          <Section title="Children">
            <p>Prepady is intended for students using it with appropriate consent. If you believe a child has provided us data without proper consent, contact us and we will address it.</p>
          </Section>

          <Section title="Changes">
            <p>We may update this policy; we will revise the “last updated” date above. Continued use after changes means you accept the updated policy.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about privacy? Contact us at <b>support@prepady.com</b>.</p>
          </Section>

          <p className="text-xs text-muted-foreground border-t border-border pt-4">This policy is a general template for an MVP and should be reviewed to reflect your organisation’s actual data practices and local legal requirements before public launch.</p>
        </div>

        <p className="mt-8"><Link href="/terms" className="text-sm font-semibold text-gold-700 hover:text-gold-800">Terms of Service →</Link></p>
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
