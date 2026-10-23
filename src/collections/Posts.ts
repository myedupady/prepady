import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

/** Slugify a title (lowercase, hyphenated) for the public blog URL. */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const ensureSlug: CollectionBeforeChangeHook = ({ data }) => {
  if (!data.slug && data.title) data.slug = slugify(String(data.title))
  else if (data.slug) data.slug = slugify(String(data.slug))
  // Stamp publishedAt the first time a post goes live.
  if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString()
  return data
}

/**
 * Blog posts — study tips, exam news, product updates. Public to read;
 * only admins (and content editors) can write. Rendered at /blog and
 * /blog/[slug] with the Lexical rich-text renderer.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
    description: 'Blog posts shown at /blog.',
    listSearchableFields: ['title', 'excerpt'],
  },
  hooks: { beforeChange: [ensureSlug] },
  access: {
    read: () => true, // public blog
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Auto-generated from the title; edit for a custom URL.' },
    },
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
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'author', type: 'text', defaultValue: 'Prepady Team', admin: { position: 'sidebar' } },
    { name: 'excerpt', type: 'textarea', admin: { rows: 3, description: 'Short summary shown on the blog list and social cards.' } },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Cover image' },
    { name: 'content', type: 'richText', required: true },
  ],
}
