import crypto from 'crypto'
import type { Payload } from 'payload'

/** Random, URL-safe verification token. */
export function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/** Token lifetime: 24 hours. */
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Send the "confirm your email" message via the configured Payload email
 * adapter (Resend). Non-fatal: logs and returns on failure so signup never
 * breaks because of an email hiccup.
 */
export async function sendVerificationEmail(
  payload: Payload,
  args: { to: string; name?: string; token: string },
): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const url = `${base}/verify?token=${args.token}`
  const name = args.name || 'there'
  try {
    await payload.sendEmail({
      to: args.to,
      subject: 'Confirm your Prepady email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #201B15; padding: 22px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #F6F2E9; margin: 0; font-size: 24px;">Prepady<span style="color:#F2A33C;">.</span></h1>
          </div>
          <div style="background-color: #FBF8F1; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #201B15;">Confirm your email</h2>
            <p style="color: #6F665A;">Hi ${name}, tap the button below to confirm your email and unlock the AI tutor. This link expires in 24 hours.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #F2A33C; color: #201B15; padding: 12px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Confirm email</a>
            </div>
            <p style="color: #9b9486; font-size: 12px;">Or copy this link: <a href="${url}" style="color:#C77E12;">${url}</a></p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    payload.logger?.warn?.(`[verify] failed to send verification email to ${args.to}: ${String(err)}`)
  }
}
