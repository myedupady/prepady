import type { CollectionConfig } from 'payload'

/**
 * One student attempt — practice or a timed CBT mock. Mirrors the proven
 * Myedupady session model (adaptive state + per-question answer log) adapted
 * to Prepady's exam/subject taxonomy.
 */
export const QuizSessions: CollectionConfig = {
  slug: 'quiz-sessions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'exam', 'mode', 'status', 'score', 'maxScore', 'startedAt'],
    description: 'Student practice and mock-exam attempts.',
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { user: { equals: req.user.id } }
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      return { user: { equals: req.user.id } }
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, admin: { position: 'sidebar' } },
    { name: 'exam', type: 'text', required: true, admin: { position: 'sidebar' } },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      admin: { position: 'sidebar', description: 'Single-subject focus, or blank for a mixed/mock session.' },
    },
    {
      name: 'topicRef',
      type: 'relationship',
      relationTo: 'topics',
      admin: { position: 'sidebar', description: 'Single-topic focus, or blank for a whole-subject/mixed session.' },
    },
    {
      name: 'pastYear',
      type: 'number',
      admin: { position: 'sidebar', description: 'Set for a past-questions session (serves only that year). Blank = simulated practice.' },
    },
    {
      name: 'mode',
      type: 'select',
      defaultValue: 'practice',
      options: [
        { label: 'Practice (adaptive)', value: 'practice' },
        { label: 'Mock (timed CBT)', value: 'mock' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Completed', value: 'completed' },
        { label: 'Abandoned', value: 'abandoned' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'totalQuestions', type: 'number', required: true },
    { name: 'timeLimitMinutes', type: 'number' },
    { name: 'currentDifficulty', type: 'number', defaultValue: 1, min: 1, max: 3 },
    { name: 'correctStreak', type: 'number', defaultValue: 0 },
    { name: 'startedAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'completedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'score', type: 'number', defaultValue: 0 },
    { name: 'maxScore', type: 'number', defaultValue: 0 },
    {
      name: 'answers',
      type: 'array',
      label: 'Answers',
      fields: [
        { name: 'question', type: 'relationship', relationTo: 'questions', required: true },
        { name: 'questionSnapshot', type: 'json' },
        { name: 'givenAnswer', type: 'text' },
        { name: 'isCorrect', type: 'checkbox', defaultValue: false },
        { name: 'pointsEarned', type: 'number', defaultValue: 0 },
        // Denormalised labels for cheap per-subject/topic gap detection.
        { name: 'subjectName', type: 'text' },
        { name: 'topicName', type: 'text' },
        { name: 'answeredAt', type: 'date' },
      ],
    },
    { name: 'askedQuestionIds', type: 'json' },
    { name: 'subjectPlan', type: 'json' },
  ],
}
