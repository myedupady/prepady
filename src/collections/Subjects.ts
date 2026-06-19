import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { slugify } from '@/lib/utils'
import { EXAMS } from '@/lib/exams'

const autoSlug: CollectionBeforeValidateHook = ({ data, operation }) => {
  if ((operation === 'create' || !data?.slug) && data?.name) {
    data.slug = slugify(data.name as string)
  }
  return data
}

/**
 * Exam subjects (Mathematics, English, Physics, Economics, …). Admin-managed so
 * the catalogue can grow per exam without code changes. Questions relate to a
 * subject; the `exams` field marks which exams a subject appears in.
 */
export const Subjects: CollectionConfig = {
  slug: 'subjects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
    description: 'Exam subjects students can practise (Mathematics, English, Physics …).',
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: { beforeValidate: [autoSlug] },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Subject Name' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL-safe — auto-generated from the name.' },
    },
    {
      name: 'exams',
      type: 'select',
      hasMany: true,
      label: 'Available For Exams',
      options: EXAMS.map((e) => ({ label: e.label, value: e.value })),
      admin: { description: 'Which exams this subject is offered under.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
}
