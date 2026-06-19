import type { CollectionConfig } from 'payload'

/**
 * Uploaded images — mainly diagrams for maths/science/NVR-style questions.
 * Uses Payload local storage for the MVP (see README → roadmap for cloud storage).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  upload: {
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
  ],
}
