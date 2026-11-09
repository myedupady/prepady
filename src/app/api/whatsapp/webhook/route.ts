import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyWhatsappSignature, whatsappVerifyToken } from '@/lib/whatsapp'
import { handleInbound } from '@/lib/whatsapp-flow'

/**
 * Meta WhatsApp Cloud API webhook.
 *  GET  — the one-time subscription challenge (verify_token must match env).
 *  POST — inbound messages; signature-verified, then handed to the funnel.
 * Inert until the WhatsApp env vars are set (see lib/whatsapp.ts).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const mode = sp.get('hub.mode')
  const token = sp.get('hub.verify_token')
  const challenge = sp.get('hub.challenge')
  if (mode === 'subscribe' && token && whatsappVerifyToken && token === whatsappVerifyToken) {
    return new NextResponse(challenge ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

interface WaMessage {
  from?: string
  type?: string
  text?: { body?: string }
  interactive?: { type?: string; list_reply?: { id?: string }; button_reply?: { id?: string } }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!verifyWhatsappSignature(raw, req.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  let body: { entry?: Array<{ changes?: Array<{ value?: { messages?: WaMessage[]; contacts?: Array<{ wa_id?: string; profile?: { name?: string } }> } }> }> }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ received: true })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        const messages = value?.messages ?? []
        for (const m of messages) {
          if (!m.from) continue
          const contact = value?.contacts?.find((c) => c.wa_id === m.from)
          const name = contact?.profile?.name
          let text: string | undefined
          let replyId: string | null = null
          if (m.type === 'text') text = m.text?.body
          else if (m.type === 'interactive') replyId = m.interactive?.list_reply?.id ?? m.interactive?.button_reply?.id ?? null
          await handleInbound(payload, { phone: m.from, name, text, replyId })
        }
      }
    }
  } catch (err) {
    console.error('whatsapp/webhook error:', err)
    // Always 200 so Meta doesn't retry-storm on our internal error.
  }
  return NextResponse.json({ received: true })
}
