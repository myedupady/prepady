import type { CollectionConfig } from 'payload'

/**
 * Auth collection. Students self-register; `plan` + `subscriptionExpiresAt`
 * drive the freemium paywall, and `aiUsesToday` meters free-tier AI usage.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'plan', 'subscriptionExpiresAt'],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { id: { equals: req.user.id } }
    },
    create: () => true, // public signup
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { id: { equals: req.user.id } }
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Full Name',
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'student',
      required: true,
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Admin', value: 'admin' },
      ],
      // Only admins can change roles — students can't promote themselves.
      access: { update: ({ req }) => req.user?.role === 'admin' },
      admin: { position: 'sidebar' },
    },
    // ── Subscription (freemium) ───────────────────────────────────────────
    {
      name: 'plan',
      type: 'select',
      defaultValue: 'free',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Premium', value: 'premium' },
      ],
      access: { update: ({ req }) => req.user?.role === 'admin' },
      admin: {
        position: 'sidebar',
        description: 'Premium unlocks unlimited AI explanations, full CBT mocks, and essay marking.',
      },
    },
    {
      name: 'subscriptionExpiresAt',
      type: 'date',
      access: { update: ({ req }) => req.user?.role === 'admin' },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'When the current premium subscription lapses. Set by the Paystack webhook.',
      },
    },
    {
      name: 'paystackCustomerCode',
      type: 'text',
      access: { update: ({ req }) => req.user?.role === 'admin' },
      admin: { position: 'sidebar', readOnly: true },
    },
    // ── Free-tier AI metering ─────────────────────────────────────────────
    {
      name: 'aiUsesToday',
      type: 'number',
      defaultValue: 0,
      access: { update: ({ req }) => req.user?.role === 'admin' },
      admin: {
        position: 'sidebar',
        description: 'AI explanations used today (free tier). Resets daily.',
      },
    },
    {
      name: 'aiUsesResetAt',
      type: 'date',
      access: { update: ({ req }) => req.user?.role === 'admin' },
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
