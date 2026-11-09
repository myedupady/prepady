import type { CollectionConfig } from 'payload'

/**
 * Lightweight conversation state for the WhatsApp funnel, keyed by phone number.
 * Serverless functions are stateless, so the flow persists its step + context
 * here between inbound messages. Admin-only (it holds phone numbers = PII).
 */
export const WhatsappSessions: CollectionConfig = {
  slug: 'whatsapp-sessions',
  admin: {
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'step', 'updatedAt'],
    description: 'WhatsApp funnel conversation state (one row per phone number).',
  },
  access: {
    read: ({ req }) => req.user?.role === 'admin',
    create: ({ req }) => req.user?.role === 'admin', // written by the webhook via overrideAccess
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'phone', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text' },
    { name: 'step', type: 'text', defaultValue: 'new' },
    { name: 'data', type: 'json' },
  ],
}
