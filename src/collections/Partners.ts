import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

/** Normalise partner codes to uppercase, no spaces. */
const normaliseCode: CollectionBeforeChangeHook = ({ data }) => {
  if (data.code) data.code = String(data.code).trim().toUpperCase().replace(/\s+/g, '')
  return data
}

/**
 * B2B partners / affiliates. An admin creates a partner with a shareable code.
 * Students who sign up with that code get a discount on every payment, and a
 * share of each such payment's revenue is attributed to the partner. The partner
 * can be linked to a platform user (`profile`) so they can sign in and see their
 * own earnings and attributed transactions — and nothing else.
 */
export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'discountValue', 'revenueShareValue', 'active'],
    description: 'B2B partners/affiliates. Each has a code students sign up with for a discount; revenue share is attributed to the partner.',
    listSearchableFields: ['name', 'code'],
  },
  hooks: { beforeChange: [normaliseCode] },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { profile: { equals: req.user.id } } // a partner sees only their own record
    },
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Partner / Business name' },
    { name: 'code', type: 'text', required: true, unique: true, index: true, admin: { description: 'The code students sign up with, e.g. LAGOS-ACADEMY. Shared as /signup?ref=CODE.' } },
    {
      name: 'profile',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', description: 'The platform account that can sign in to see this partner’s earnings (optional).' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    // ── Student discount (applied at every checkout for referred students) ──
    {
      name: 'discountType',
      type: 'select',
      defaultValue: 'percent',
      options: [
        { label: 'Percent (%)', value: 'percent' },
        { label: 'Fixed (₦)', value: 'fixed' },
      ],
      admin: { position: 'sidebar', description: 'How the student discount is calculated.' },
    },
    { name: 'discountValue', type: 'number', defaultValue: 0, min: 0, admin: { position: 'sidebar', description: 'e.g. 10 (%) or 500 (₦ off).' } },
    // ── Partner revenue share (attributed on each paid transaction) ──
    {
      name: 'revenueShareType',
      type: 'select',
      defaultValue: 'percent',
      options: [
        { label: 'Percent (%)', value: 'percent' },
        { label: 'Fixed (₦)', value: 'fixed' },
      ],
      admin: { position: 'sidebar', description: 'How the partner’s revenue share is calculated per payment.' },
    },
    { name: 'revenueShareValue', type: 'number', defaultValue: 0, min: 0, admin: { position: 'sidebar', description: 'e.g. 20 (% of the amount paid) or 300 (₦ per payment).' } },
    { name: 'notes', type: 'textarea', admin: { rows: 3, description: 'Agreement terms, contact, etc. (admin only).' } },
  ],
}
