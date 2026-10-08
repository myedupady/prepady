/**
 * Model pricing + cost estimation.
 *
 * Prices are USD per 1,000,000 tokens, taken from the Anthropic pricing page
 * (and approximate list prices for Gemini — verify against Google's pricing).
 * Everything downstream (the spend circuit-breaker, the CLI cost preview, the
 * admin usage counters) is driven from this one table, so keeping it correct
 * keeps every cost figure in the app correct.
 *
 * NOTE ON CACHING: a cache *read* (hit) costs 0.1x the base input price on the
 * Claude models we use. Cache *writes* cost 1.25x (5-min) or 2x (1-hour). We
 * only model read hits here because that is what affects steady-state cost; the
 * one-time write premium is negligible and self-correcting after two reads.
 */

export interface ModelPrice {
  /** USD per 1M input tokens. */
  input: number
  /** USD per 1M output tokens. */
  output: number
  /** Multiplier applied to `input` for cache-read (hit) tokens. */
  cacheReadMultiplier: number
}

/** Canonical price table. Keys are the exact model IDs we send to the API. */
export const MODEL_PRICES: Record<string, ModelPrice> = {
  // ── Anthropic ────────────────────────────────────────────────────────────
  'claude-haiku-4-5': { input: 1, output: 5, cacheReadMultiplier: 0.1 },
  'claude-haiku-3-5': { input: 0.8, output: 4, cacheReadMultiplier: 0.1 },
  'claude-sonnet-4-5': { input: 3, output: 15, cacheReadMultiplier: 0.1 },
  'claude-sonnet-5': { input: 2, output: 10, cacheReadMultiplier: 0.1 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheReadMultiplier: 0.1 },
  'claude-opus-4-5': { input: 5, output: 25, cacheReadMultiplier: 0.1 },
  'claude-opus-5-5': { input: 4, output: 20, cacheReadMultiplier: 0.05 },
  // ── Google Gemini (approximate list prices — verify) ───────────────────────
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4, cacheReadMultiplier: 0.25 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5, cacheReadMultiplier: 0.25 },
}

/** A conservative fallback used when a model ID is not in the table. */
const FALLBACK_PRICE: ModelPrice = { input: 3, output: 15, cacheReadMultiplier: 0.1 }

export function priceFor(model: string): ModelPrice {
  return MODEL_PRICES[model] ?? FALLBACK_PRICE
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  /** Portion of `inputTokens` that was served from cache (billed at the read multiplier). */
  cachedInputTokens?: number
}

/**
 * Estimate the USD cost of a single call. `cachedInputTokens` are billed at the
 * cache-read rate and are assumed to be a subset of `inputTokens`.
 */
export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const p = priceFor(model)
  const cached = Math.min(usage.cachedInputTokens ?? 0, usage.inputTokens)
  const uncachedInput = usage.inputTokens - cached
  const inputCost = (uncachedInput * p.input + cached * p.input * p.cacheReadMultiplier) / 1_000_000
  const outputCost = (usage.outputTokens * p.output) / 1_000_000
  return inputCost + outputCost
}

/** Round a USD amount to whole micro-dollars (6 dp) to avoid float drift in counters. */
export function roundUsd(usd: number): number {
  return Math.round(usd * 1_000_000) / 1_000_000
}
