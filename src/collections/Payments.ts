import type { CollectionConfig, Where } from 'payload'

/**
 * A payment transaction (one Paystack charge). Written server-side by the
 * verify/webhook routes. Powers the admin finance trail, the student's billing
 * history, and partner earnings. `partnerProfile` denormalises the partner's
 * linked user id so a partner can read exactly the transactions attributed to
 * them (and nothing else) via collection access control.
 */
export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'user', 'amount', 'status', 'partner', 'paidAt'],
    description: 'Payment transactions (Paystack). Written automatically on successful payment.',
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      // A student sees their own payments; a partner sees payments attributed to them.
      return { or: [{ user: { equals: req.user.id } }, { partnerProfile: { equals: req.user.id } }] } as Where
    },
    create: ({ req }) => req.user?.role === 'admin', // system writes use overrideAccess
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'reference', type: 'text', required: true, unique: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, admin: { position: 'sidebar' } },
    { name: 'email', type: 'text', admin: { position: 'sidebar' } },
    { name: 'planId', type: 'text', admin: { position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'success',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'baseAmount', type: 'number', label: 'Base amount (₦)', admin: { description: 'Plan price before any discount.' } },
    { name: 'discountAmount', type: 'number', defaultValue: 0, label: 'Discount (₦)' },
    { name: 'amount', type: 'number', label: 'Amount paid (₦)', admin: { description: 'Actual amount charged.' } },
    // ── Partner attribution ──
    { name: 'partner', type: 'relationship', relationTo: 'partners', admin: { position: 'sidebar' } },
    { name: 'partnerCode', type: 'text', admin: { position: 'sidebar' } },
    { name: 'partnerProfile', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', description: 'The partner’s linked account (for their own view).' } },
    { name: 'partnerShareAmount', type: 'number', defaultValue: 0, label: 'Partner share (₦)' },
    { name: 'paystackCustomerCode', type: 'text', admin: { position: 'sidebar', readOnly: true } },
    { name: 'paidAt', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
