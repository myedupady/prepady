import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildExplainUser, buildFollowUpUser, buildMarkUser } from '../prompts'

test('buildExplainUser includes question, lettered options, and answers', () => {
  const out = buildExplainUser({
    exam: 'JAMB',
    subject: 'Mathematics',
    topic: 'Indices',
    questionText: 'The value of 2^5 is:',
    options: ['10', '16', '32', '25'],
    correctAnswer: '32',
    givenAnswer: '25',
  })
  assert.match(out, /Exam: JAMB/)
  assert.match(out, /Subject: Mathematics/)
  assert.match(out, /A\. 10/)
  assert.match(out, /C\. 32/)
  assert.match(out, /Correct answer: 32/)
  assert.match(out, /The student answered: 25/)
})

test('buildExplainUser omits optional lines when absent', () => {
  const out = buildExplainUser({ exam: 'WAEC', questionText: 'Define photosynthesis.' })
  assert.doesNotMatch(out, /Subject:/)
  assert.doesNotMatch(out, /Options:/)
  assert.doesNotMatch(out, /Correct answer:/)
})

test('buildFollowUpUser includes the prior explanation and the follow-up', () => {
  const out = buildFollowUpUser({
    exam: 'JAMB',
    questionText: 'Solve 2x+3=11',
    priorExplanation: 'Subtract 3, divide by 2.',
    message: 'Where did the 3 go?',
  })
  assert.match(out, /Explanation already shown to the student:/)
  assert.match(out, /Subtract 3, divide by 2\./)
  assert.match(out, /Student follow-up: Where did the 3 go\?/)
})

test('buildMarkUser includes the scheme, answer, and mark count', () => {
  const out = buildMarkUser({
    exam: 'WAEC',
    questionText: 'Explain the water cycle.',
    markingScheme: '1 mark: evaporation. 1 mark: condensation.',
    maxMarks: 2,
    answer: 'Water evaporates then falls as rain.',
  })
  assert.match(out, /worth 2 marks/)
  assert.match(out, /Marking scheme/)
  assert.match(out, /evaporation/)
  assert.match(out, /Student's answer:/)
  assert.match(out, /Water evaporates/)
})

test('buildMarkUser uses singular "mark" for 1', () => {
  const out = buildMarkUser({ exam: 'X', questionText: 'q', markingScheme: 's', maxMarks: 1, answer: 'a' })
  assert.match(out, /worth 1 mark\b/)
})
