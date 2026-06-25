import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { slugify } from '@/lib/utils'

const autoSlug: CollectionBeforeValidateHook = ({ data }) => {
  // Only fill the slug when it's blank — never overwrite a provided one.
  if (data && !data.slug && data.name) {
    data.slug = slugify(data.name as string)
  }
  return data
}

/**
 * Exam regions (West Africa, East Africa, …). Admin-managed. Each region's
 * `color` is used to tint its exam chips on the site — change it here and the
 * site follows. Seeded from src/lib/exams.ts via `pnpm seed`.
 */
export const Regions: CollectionConfig = {
  slug: 'regions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'color', 'order'],
    group: 'Catalogue',
    description: 'Regions exams are grouped under. Each region’s colour tints its exam chips.',
  },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  defaultSort: 'order',
  hooks: { beforeValidate: [autoSlug] },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Region Name' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL-safe — auto-generated from the name.' },
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      defaultValue: '#2563EB',
      label: 'Chip Colour',
      admin: {
        description: 'Colour for this region’s exam chips.',
        components: { Field: '/src/components/admin/ColorField.tsx#ColorField' },
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first.' },
    },
  ],
}
