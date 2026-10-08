import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseMathSegments, hasMath } from '../math'

test('plain text is one text segment', () => {
  assert.deepEqual(parseMathSegments('hello world'), [{ type: 'text', value: 'hello world' }])
})

test('inline math is extracted', () => {
  assert.deepEqual(parseMathSegments('x is $x^2$ here'), [
    { type: 'text', value: 'x is ' },
    { type: 'inline', value: 'x^2' },
    { type: 'text', value: ' here' },
  ])
})

test('display math is extracted', () => {
  assert.deepEqual(parseMathSegments('see $$a+b$$'), [
    { type: 'text', value: 'see ' },
    { type: 'display', value: 'a+b' },
  ])
})

test('display delimiters take priority over inline', () => {
  const segs = parseMathSegments('$$\\frac{1}{2}$$')
  assert.equal(segs.length, 1)
  assert.equal(segs[0].type, 'display')
  assert.equal(segs[0].value, '\\frac{1}{2}')
})

test('escaped dollar is literal text, not math', () => {
  const segs = parseMathSegments('it costs \\$5 today')
  assert.equal(segs.length, 1)
  assert.equal(segs[0].type, 'text')
  assert.equal(segs[0].value, 'it costs $5 today')
})

test('hasMath detects presence/absence', () => {
  assert.equal(hasMath('no math here'), false)
  assert.equal(hasMath('with $x$'), true)
})

test('empty string yields no segments', () => {
  assert.deepEqual(parseMathSegments(''), [])
})
