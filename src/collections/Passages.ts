import type { CollectionConfig } from 'payload'

/**
 * A reading passage for comprehension. Questions attach to a passage via their
 * `passage` field; the student reads the passage and answers its questions
 * together (comprehension flow). Passage-linked questions are kept out of the
 * normal adaptive practice (they need the passage for context).
 */
export const Passages: CollectionConfig = {
  slug: 'passages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'exam', 'subject', 'status'],
    description: 'Reading passages for comprehension. Attach questions to a passage via the question’s "Passage" field.',
    listSearchableFields: ['title'],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Title', admin: { description: 'e.g. "Passage 1 — The Rainforest".' } },
    { name: 'exam', type: 'relationship', relationTo: 'exams', required: true, admin: { position: 'sidebar' } },
    { name: 'subject', type: 'relationship', relationTo: 'subjects', admin: { position: 'sidebar', description: 'Usually English Language.' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'year', type: 'number', label: 'Past Question Year', admin: { position: 'sidebar', description: 'Optional — for a past-paper comprehension.' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Lower numbers appear first.' } },
    {
      name: 'instructions',
      type: 'text',
      admin: { description: 'Optional, e.g. "Read the passage and answer the questions that follow."' },
    },
    {
      name: 'passage',
      type: 'textarea',
      required: true,
      label: 'Passage text',
      admin: { rows: 14, description: 'The reading passage shown to students above the questions.' },
    },
  ],
}
