import type { CollectionConfig } from 'payload'

/**
 * Video lessons (YouTube/Vimeo links). A premium feature — a few lessons are
 * marked Free as a preview; the rest require an active premium plan. Playback
 * gating happens in the /learn pages; this collection just stores the catalogue.
 */
export const VideoLessons: CollectionConfig = {
  slug: 'video-lessons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'exam', 'subject', 'isFree', 'status'],
    description: 'Video lessons shown at /learn. Paste an unlisted YouTube/Vimeo link; mark a few as Free.',
    listSearchableFields: ['title'],
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    update: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'exam', type: 'relationship', relationTo: 'exams', required: true, admin: { position: 'sidebar' } },
    { name: 'subject', type: 'relationship', relationTo: 'subjects', admin: { position: 'sidebar' } },
    { name: 'topicRef', type: 'relationship', relationTo: 'topics', label: 'Topic', admin: { position: 'sidebar' } },
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
    {
      name: 'isFree',
      type: 'checkbox',
      defaultValue: false,
      label: 'Free preview',
      admin: { position: 'sidebar', description: 'If on, any student can watch. Otherwise premium only.' },
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Lower numbers appear first.' } },
    { name: 'youtubeUrl', type: 'text', required: true, label: 'Video URL', admin: { description: 'YouTube or Vimeo link (unlisted is fine).' } },
    { name: 'durationLabel', type: 'text', label: 'Duration', admin: { description: 'Optional, e.g. "12:30".' } },
    { name: 'description', type: 'textarea', admin: { rows: 3 } },
  ],
}
