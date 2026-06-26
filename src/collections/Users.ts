import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

/**
 * Promote the very first user created to admin — avoids the chicken-and-egg
 * where the /admin setup creates a user that can't then elevate itself.
 */
const promoteFirstUserToAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create') {
    const { totalDocs } = await req.payload.count({ collection: 'users' })
    if (totalDocs === 0) data.role = 'admin'
  }
  return data
}

/**
 * Auth collection. Students self-register; `plan` + `subscriptionExpiresAt`
 * drive the freemium paywall, and `aiUsesToday` meters free-tier AI usage.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token ?? ''
        const userName = (args?.user as { name?: string } | undefined)?.name ?? 'there'
        const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const url = `${base}/reset-password?token=${token}`
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #201B15; padding: 22px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #F6F2E9; margin: 0; font-size: 24px;">Prepady<span style="color:#F2A33C;">.</span></h1>
            </div>
            <div style="background-color: #FBF8F1; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #201B15;">Reset your password</h2>
              <p style="color: #6F665A;">Hi ${userName}, tap the button below to set a new password. This link expires in 1 hour.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #F2A33C; color: #201B15; padding: 12px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Reset password</a>
              </div>
              <p style="color: #6F665A; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
              <p style="color: #9b9486; font-size: 12px;">Or copy this link: <a href="${url}" style="color:#C77E12;">${url}</a></p>
            </div>
          </div>
        `
      },
    },
  },
  hooks: { beforeChange: [promoteFirstUserToAdmin] },
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
