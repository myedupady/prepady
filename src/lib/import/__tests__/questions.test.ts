import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseQuestionRow } from '../questions'

const mcq = (over: Record<string, string> = {}): Record<string, string> => ({
  type: 'mcq',
  exam: 'JAMB',
  subject: 'Mathematics',
  topic: 'Indices',
  difficulty: '2',
  question: 'The value of 2^5 is:',
  optiona: '10',
  optionb: '16',
  optionc: '32',
  optiond: '25',
  correct: 'C',
  ...over,
})

test('valid MCQ maps the correct letter to its option text', () => {
  const { parsed, errors } = parseQuestionRow(mcq())
  assert.deepEqual(errors, [])
  assert.equal(parsed?.correctAnswer, '32')
  assert.deepEqual(parsed?.options, ['10', '16', '32', '25'])
  assert.equal(parsed?.status, 'draft')
  assert.equal(parsed?.maxMarks, 1)
})

test('MCQ without a correct letter errors', () => {
  const { parsed, errors } = parseQuestionRow(mcq({ correct: '' }))
  assert.equal(parsed, undefined)
  assert.ok(errors.some((e) => /correct/.test(e)))
})

test('MCQ with correct letter beyond options errors', () => {
  const { errors } = parseQuestionRow(mcq({ correct: 'E' }))
  assert.ok(errors.some((e) => /no option E/.test(e)))
})

test('MCQ with fewer than 2 options errors', () => {
  const { errors } = parseQuestionRow(mcq({ optionb: '', optionc: '', optiond: '', correct: 'A' }))
  assert.ok(errors.some((e) => /at least 2 options/.test(e)))
})

test('difficulty words normalise and blank defaults to 2', () => {
  assert.equal(parseQuestionRow(mcq({ difficulty: 'hard' })).parsed?.difficulty, '3')
  assert.equal(parseQuestionRow(mcq({ difficulty: 'easy' })).parsed?.difficulty, '1')
  assert.equal(parseQuestionRow(mcq({ difficulty: '' })).parsed?.difficulty, '2')
})

test('invalid difficulty errors', () => {
  const { errors } = parseQuestionRow(mcq({ difficulty: 'spicy' }))
  assert.ok(errors.some((e) => /difficulty/.test(e)))
})

test('status published is respected; invalid status errors', () => {
  assert.equal(parseQuestionRow(mcq({ status: 'published' })).parsed?.status, 'published')
  assert.ok(parseQuestionRow(mcq({ status: 'live' })).errors.some((e) => /status/.test(e)))
})

test('theory requires a marking scheme', () => {
  const base = { type: 'theory', exam: 'WAEC', subject: 'Biology', topic: 'Photosynthesis', question: 'Explain photosynthesis.' }
  assert.ok(parseQuestionRow(base).errors.some((e) => /marking_scheme/.test(e)))
  const ok = parseQuestionRow({ ...base, marking_scheme: '1 mark per correct point', max_marks: '5' })
  assert.deepEqual(ok.errors, [])
  assert.equal(ok.parsed?.markingScheme, '1 mark per correct point')
  assert.equal(ok.parsed?.maxMarks, 5)
})

test('invalid type errors', () => {
  assert.ok(parseQuestionRow(mcq({ type: 'essay' })).errors.some((e) => /type/.test(e)))
})

test('invalid year and max_marks error', () => {
  assert.ok(parseQuestionRow(mcq({ year: '99' })).errors.some((e) => /year/.test(e)))
  assert.ok(parseQuestionRow(mcq({ max_marks: '0' })).errors.some((e) => /max_marks/.test(e)))
})

test('source_ref and video_url pass through', () => {
  const { parsed } = parseQuestionRow(mcq({ source_ref: 'JAMB-2019-Q1', video_url: 'https://youtu.be/x' }))
  assert.equal(parsed?.sourceRef, 'JAMB-2019-Q1')
  assert.equal(parsed?.videoSolutionUrl, 'https://youtu.be/x')
})
