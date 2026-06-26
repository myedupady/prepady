/**
 * Inline Resend email adapter for Payload (reused from Myedupady, branded for
 * Prepady). Fails gracefully when RESEND_API_KEY is not set, so signup/auth keep
 * working even before email is configured.
 *
 * Env (reuse Myedupady's Resend account):
 *   RESEND_API_KEY     — from resend.com
 *   RESEND_FROM_EMAIL  — a verified sender (e.g. no-reply@myedupady.com until
 *                        Prepady has its own verified domain)
 */
import type { EmailAdapter } from 'payload'

const FROM_NAME = 'Prepady'

export function payloadEmailAdapter(): EmailAdapter {
  return () => ({
    name: 'resend',
    defaultFromAddress: process.env.RESEND_FROM_EMAIL ?? 'no-reply@myedupady.com',
    defaultFromName: FROM_NAME,
    sendEmail: async (message) => {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        console.warn(
          `[Payload email] RESEND_API_KEY not set — skipping email.`,
          `\n  To: ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`,
          `\n  Subject: ${message.subject}`,
        )
        return
      }
      const { Resend } = await import('resend')
      const resend = new Resend(apiKey)
      const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'no-reply@myedupady.com'
      const from = `${FROM_NAME} <${fromAddress}>`
      const toArray = Array.isArray(message.to) ? message.to : [message.to]
      const { error } = await resend.emails.send({
        from,
        to: toArray,
        subject: message.subject,
        html: typeof message.html === 'string' ? message.html : '',
        ...(typeof message.text === 'string' ? { text: message.text } : {}),
      })
      if (error) {
        // Non-fatal — never break auth flows on email failure.
        console.error('[Payload email] Resend send error (non-fatal):', error)
      }
    },
  })
}
