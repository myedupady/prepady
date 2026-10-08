import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveVerdict, parseMarkResult } from '../marking'
import { isAIError } from '../types'

test('deriveVerdict bands by achieved fraction', () => {
  assert.equal(deriveVerdict(10, 10), 'excellent') // 100%
  assert.equal(deriveVerdict(85, 100), 'excellent') // 85%
  assert.equal(deriveVerdict(60, 100), 'good') // 60%
  assert.equal(deriveVerdict(40, 100), 'fair') // 40%
  assert.equal(deriveVerdict(39, 100), 'weak') // 39%
  assert.equal(deriveVerdict(0, 0), 'weak') // guard against /0
})

test('parseMarkResult clamps score into [0, maxMarks] and rounds', () => {
  assert.equal(parseMarkResult({ score: 999, strengths: [], improvements: [], summary: 'x' }, 5).score, 5)
  assert.equal(parseMarkResult({ score: -4, strengths: [], improvements: [], summary: 'x' }, 5).score, 0)
  assert.equal(parseMarkResult({ score: 3.7, strengths: [], improvements: [], summary: 'x' }, 5).score, 4)
})

test('parseMarkResult derives verdict from the clamped score', () => {
  const r = parseMarkResult({ score: 5, strengths: [], improvements: [], summary: 'x' }, 5)
  assert.equal(r.verdict, 'excellent')
  assert.equal(r.maxMarks, 5)
})

test('parseMarkResult coerces non-array strengths/improvements to []', () => {
  const r = parseMarkResult({ score: 1, strengths: 'nope', improvements: null, summary: 'x' }, 5)
  assert.deepEqual(r.strengths, [])
  assert.deepEqual(r.improvements, [])
})

test('parseMarkResult filters empty strings and caps list length', () => {
  const many = Array.from({ length: 20 }, (_, i) => (i % 2 ? '' : `point ${i}`))
  const r = parseMarkResult({ score: 2, strengths: many, improvements: [], summary: 'x' }, 5)
  assert.ok(r.strengths.length <= 6)
  assert.ok(r.strengths.every((s) => s.length > 0))
})

test('parseMarkResult supplies a default summary when missing', () => {
  const r = parseMarkResult({ score: 2, strengths: [], improvements: [] }, 5)
  assert.ok(r.summary.length > 0)
})

test('parseMarkResult throws on non-object or non-numeric score', () => {
  assert.throws(() => parseMarkResult(null, 5), (e) => isAIError(e) && e.code === 'invalid_output')
  assert.throws(() => parseMarkResult({ score: 'abc' }, 5), (e) => isAIError(e) && e.code === 'invalid_output')
})
