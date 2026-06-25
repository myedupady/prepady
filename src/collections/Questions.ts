import type { CollectionConfig } from 'payload'
import { DIFFICULTIES } from '@/lib/exams'

/**
 * The question bank — past questions + practice items across WAEC/NECO/JAMB/etc.
 * Supports MCQ (auto-graded + adaptive) and theory/essay (AI-marked in Phase 3).
 */
export const Questions: CollectionConfig = {
  slug: 'questions',
  admin: {
    useAsTitle: 'questionText',
    defaultColumns: ['questionText', 'exam', 'subject', 'topic', 'difficulty', 'status'],
    description: 'Past questions and practice items. MCQs are adaptive & auto-graded; theory questions are AI-marked.',
    listSearchableFields: ['questionText', 'topic'],
  },
  access: {
    read: ({ req }) => !!req.user, // served to the quiz engine for logged-in students
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    // ── Classification (sidebar) ──────────────────────────────────────────
    {
      name: 'exam',
      type: 'relationship',
      relationTo: 'exams',
      required: true,
      label: 'Exam',
      admin: { position: 'sidebar', description: 'Which exam this question belongs to (region is derived from it).' },
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'topic',
      type: 'text',
      label: 'Topic',
      admin: { position: 'sidebar', description: 'e.g. "Quadratic Equations", "Photosynthesis". Used for gap detection.' },
    },
    {
      name: 'difficulty',
      type: 'select',
      required: true,
      defaultValue: '2',
      options: DIFFICULTIES.map((d) => ({ label: d.label, value: d.value })),
      admin: { position: 'sidebar', description: 'Served adaptively: easy → medium → hard.' },
    },
    {
      name: 'year',
      type: 'number',
      label: 'Past Question Year',
      admin: { position: 'sidebar', description: 'e.g. 2019. Leave blank for original practice questions.' },
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
    {
      name: 'questionType',
      type: 'select',
      required: true,
      defaultValue: 'mcq',
      options: [
        { label: 'Multiple Choice (MCQ)', value: 'mcq' },
        { label: 'Theory / Essay', value: 'theory' },
      ],
      admin: { position: 'sidebar' },
    },
    // ── Content ───────────────────────────────────────────────────────────
    {
      name: 'questionText',
      type: 'textarea',
      required: true,
      label: 'Question',
      admin: { rows: 3 },
    },
    {
      name: 'questionImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Question Image (optional)',
      admin: { description: 'For diagrams (maths/science).' },
    },
    {
      name: 'options',
      type: 'array',
      label: 'Answer Options',
      minRows: 2,
      maxRows: 5,
      admin: {
        description: 'For MCQ: usually 4 options (A–D).',
        condition: (data) => data?.questionType === 'mcq',
      },
      fields: [{ name: 'text', type: 'text', required: true, label: 'Option Text' }],
    },
    {
      name: 'correctAnswer',
      type: 'text',
      label: 'Correct Answer',
      admin: {
        description: 'MCQ: type the exact text of the correct option.',
        condition: (data) => data?.questionType === 'mcq',
      },
    },
    {
      name: 'markingScheme',
      type: 'textarea',
      label: 'Marking Scheme / Model Answer',
      admin: {
        rows: 4,
        description: 'Theory: the marking guide the AI uses to grade essays (Phase 3).',
        condition: (data) => data?.questionType === 'theory',
      },
    },
    {
      name: 'maxMarks',
      type: 'number',
      defaultValue: 1,
      label: 'Max Marks',
      admin: { description: 'Marks this question is worth.' },
    },
    {
      name: 'explanation',
      type: 'textarea',
      label: 'Explanation / Working',
      admin: {
        rows: 3,
        description: 'Shown after answering. The AI "Explain this to me" feature falls back to / builds on this.',
      },
    },
  ],
}
