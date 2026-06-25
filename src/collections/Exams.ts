import type { CollectionConfig } from 'payload'

/**
 * National exams students can practise (WAEC, KCSE, BAC Sénégal, …).
 * Admin-managed — add/rename/retire without a deploy. Each exam belongs to a
 * Region (which supplies its chip colour). Seeded from src/lib/exams.ts.
 */
export const Exams: CollectionConfig = {
  slug: 'exams',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'name', 'country', 'region', 'status'],
    group: 'Catalogue',
    description: 'National exams across Africa. Questions are tagged with one of these.',
    listSearchableFields: ['code', 'name', 'country'],
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      label: 'Code / short name',
      admin: { description: 'Shown on chips — e.g. WAEC, KCSE, BAC Sénégal.' },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Full name',
      admin: { description: 'e.g. West African Examinations Council.' },
    },
    { name: 'country', type: 'text', required: true, admin: { position: 'sidebar' } },
    {
      name: 'region',
      type: 'relationship',
      relationTo: 'regions',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first within a region.' },
    },
  ],
}
