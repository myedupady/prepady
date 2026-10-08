import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimateCostUsd, priceFor, roundUsd, MODEL_PRICES } from '../pricing'

test('input tokens priced at the model input rate', () => {
  // 1M input tokens on Haiku 4.5 ($1/MTok) == $1
  assert.equal(estimateCostUsd('claude-haiku-4-5', { inputTokens: 1_000_000, outputTokens: 0 }), 1)
})

test('output tokens priced at the model output rate', () => {
  // 1M output tokens on Haiku 4.5 ($5/MTok) == $5
  assert.equal(estimateCostUsd('claude-haiku-4-5', { inputTokens: 0, outputTokens: 1_000_000 }), 5)
})

test('cached input tokens billed at the cache-read multiplier', () => {
  // All input served from cache → 0.1x of $1 == $0.10
  const cost = estimateCostUsd('claude-haiku-4-5', {
    inputTokens: 1_000_000,
    outputTokens: 0,
    cachedInputTokens: 1_000_000,
  })
  assert.ok(Math.abs(cost - 0.1) < 1e-9, `expected ~0.1, got ${cost}`)
})

test('cached tokens cannot exceed total input', () => {
  const cost = estimateCostUsd('claude-haiku-4-5', {
    inputTokens: 100,
    outputTokens: 0,
    cachedInputTokens: 1_000_000, // absurd; must be clamped to 100
  })
  // 100 tokens all cached → 100 * $1 * 0.1 / 1e6
  assert.ok(Math.abs(cost - (100 * 1 * 0.1) / 1_000_000) < 1e-12)
})

test('unknown models fall back to a conservative price', () => {
  // Fallback is $3/$15 → 1M input == $3
  assert.equal(estimateCostUsd('some-unknown-model', { inputTokens: 1_000_000, outputTokens: 0 }), 3)
})

test('priceFor returns a defined shape for known and unknown models', () => {
  assert.equal(priceFor('claude-haiku-4-5').input, 1)
  const unknown = priceFor('nope')
  assert.ok(unknown.input > 0 && unknown.output > 0)
})

test('roundUsd keeps 6 decimal places', () => {
  assert.equal(roundUsd(0.0000019), 0.000002)
  assert.equal(roundUsd(1.2345678), 1.234568)
})

test('every configured model ID has a positive price', () => {
  for (const [id, p] of Object.entries(MODEL_PRICES)) {
    assert.ok(p.input >= 0 && p.output > 0 && p.cacheReadMultiplier > 0, `bad price for ${id}`)
  }
})
