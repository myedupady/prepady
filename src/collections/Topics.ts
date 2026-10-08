import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { slugify } from '@/lib/utils'

const autoSlug: CollectionBeforeValidateHook = ({ data, operation }) => {
  if ((operation === 'create' || !data?.slug) && data?.name) {
    data.slug = slugify(data.name as string)
  }
  return data
}

/**
 * Topics within a subject (e.g. Mathematics → "Quadratic Equations",
 * "Trigonometry"). First-class so students can practise topic-by-topic and we
 * can do per-topic gap detection. Questions relate to a Topic (and still carry
 * their Subject). Slugs are not globally unique — a topic is identified by its
 * subject + name; the importer de-duplicates on that pair.
 */
export const Topics: CollectionConfig = {
  slug: 'topics',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'subject', 'order'],
    description: 'Topics within a subject. Used for topic-by-topic practice and gap detection.',
    listSearchableFields: ['name'],
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: { beforeValidate: [autoSlug] },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Topic Name' },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
      admin: { description: 'The subject this topic belongs to.' },
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: { description: 'URL-safe — auto-generated from the name. Not unique across subjects.' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { rows: 2, description: 'Optional short description of what this topic covers.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
}
