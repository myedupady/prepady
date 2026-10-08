import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, csvToObjects } from '../csv'

test('parses simple rows', () => {
  assert.deepEqual(parseCsv('a,b,c\n1,2,3'), [['a', 'b', 'c'], ['1', '2', '3']])
})

test('handles quoted field with comma', () => {
  assert.deepEqual(parseCsv('a,"b,c",d'), [['a', 'b,c', 'd']])
})

test('handles quoted field with newline', () => {
  assert.deepEqual(parseCsv('a,"line1\nline2",c'), [['a', 'line1\nline2', 'c']])
})

test('handles escaped double-quotes', () => {
  assert.deepEqual(parseCsv('"she said ""hi""",x'), [['she said "hi"', 'x']])
})

test('handles CRLF line endings and trailing newline', () => {
  assert.deepEqual(parseCsv('a,b\r\n1,2\r\n'), [['a', 'b'], ['1', '2']])
})

test('strips a UTF-8 BOM', () => {
  assert.deepEqual(parseCsv('﻿a,b\n1,2'), [['a', 'b'], ['1', '2']])
})

test('csvToObjects maps lowercased headers and trims, skipping blank rows', () => {
  const objs = csvToObjects('Type, Exam\nmcq, JAMB\n\ntheory, WAEC\n')
  assert.deepEqual(objs, [
    { type: 'mcq', exam: 'JAMB' },
    { type: 'theory', exam: 'WAEC' },
  ])
})

test('csvToObjects returns [] for empty input', () => {
  assert.deepEqual(csvToObjects(''), [])
})
