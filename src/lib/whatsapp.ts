import crypto from 'crypto'

/**
 * Meta WhatsApp Cloud API client. All config comes from env vars so the webhook
 * is inert until a WhatsApp Business number is provisioned:
 *   WHATSAPP_TOKEN            permanent access token
 *   WHATSAPP_PHONE_NUMBER_ID  the sending number's id
 *   WHATSAPP_VERIFY_TOKEN     shared secret for the webhook GET challenge
 *   WHATSAPP_APP_SECRET       app secret, for verifying inbound signatures
 *   WHATSAPP_API_VERSION      optional, defaults to v21.0
 */
const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const APP_SECRET = process.env.WHATSAPP_APP_SECRET
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'

export const isWhatsappConfigured = !!(TOKEN && PHONE_ID)
export const whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN

/** Verify the X-Hub-Signature-256 header (HMAC-SHA256 of the raw body). */
export function verifyWhatsappSignature(rawBody: string, signature: string | null): boolean {
  if (!APP_SECRET) return false // no secret configured → reject (fail closed)
  if (!signature) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

async function send(payload: Record<string, unknown>): Promise<void> {
  if (!isWhatsappConfigured) return
  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[whatsapp] send failed:', res.status, body.slice(0, 500))
  }
}

export function sendText(to: string, body: string): Promise<void> {
  return send({ to, type: 'text', text: { preview_url: true, body: body.slice(0, 4096) } })
}

export function sendImage(to: string, link: string, caption?: string): Promise<void> {
  return send({ to, type: 'image', image: { link, ...(caption ? { caption: caption.slice(0, 1024) } : {}) } })
}

export interface Row { id: string; title: string; description?: string }

/** Interactive list message (up to 10 rows). Titles ≤24 chars, descriptions ≤72. */
export function sendList(to: string, body: string, button: string, rows: Row[], header?: string): Promise<void> {
  return send({
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      ...(header ? { header: { type: 'text', text: header.slice(0, 60) } } : {}),
      body: { text: body.slice(0, 1024) },
      action: {
        button: button.slice(0, 20),
        sections: [{ rows: rows.slice(0, 10).map((r) => ({ id: r.id.slice(0, 200), title: r.title.slice(0, 24), ...(r.description ? { description: r.description.slice(0, 72) } : {}) })) }],
      },
    },
  })
}

/** Interactive reply buttons (up to 3). Titles ≤20 chars. */
export function sendButtons(to: string, body: string, buttons: Row[]): Promise<void> {
  return send({
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1024) },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id.slice(0, 200), title: b.title.slice(0, 20) } })) },
    },
  })
}
