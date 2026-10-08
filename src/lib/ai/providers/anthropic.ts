/**
 * Anthropic (Claude) provider.
 *
 * Cost controls baked in:
 *  - Stable system prompts are sent as cacheable blocks (cache_control ephemeral),
 *    so repeated calls pay the 0.1x cache-read rate on the system prompt.
 *  - Tight max_tokens caps per call type.
 *  - Marking is a FORCED tool call at temperature 0 for deterministic, schema-valid
 *    output — the model cannot return a free-form grade.
 *
 * The client is created lazily so importing this module never throws when the
 * key is absent; `isConfigured()` lets callers degrade gracefully instead.
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  AIError,
  type AIProvider,
  type ExplainInput,
  type FollowUpInput,
  type MarkInput,
  type ProviderMarkResult,
  type ProviderTextResult,
} from '../types'
import type { TokenUsage } from '../pricing'
import {
  EXPLAIN_SYSTEM,
  FOLLOWUP_SYSTEM,
  MARK_SYSTEM,
  buildExplainUser,
  buildFollowUpUser,
  buildMarkUser,
} from '../prompts'
import { MARK_TOOL_NAME, MARK_TOOL_SCHEMA, parseMarkResult } from '../marking'

const EXPLAIN_MODEL = process.env.AI_EXPLAIN_MODEL ?? 'claude-haiku-4-5'
const FOLLOWUP_MODEL = process.env.AI_FOLLOWUP_MODEL ?? EXPLAIN_MODEL
const MARKING_MODEL = process.env.AI_MARKING_MODEL ?? 'claude-sonnet-4-5'

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIError('ANTHROPIC_API_KEY is not set.', 'not_configured')
  }
  if (!_client) _client = new Anthropic()
  return _client
}

function usageFrom(u: Anthropic.Usage): TokenUsage {
  const cached = u.cache_read_input_tokens ?? 0
  return {
    // Anthropic reports cache-read tokens separately from input_tokens, so add
    // them back to get the true input total, then flag the cached portion.
    inputTokens: (u.input_tokens ?? 0) + cached,
    outputTokens: u.output_tokens ?? 0,
    cachedInputTokens: cached,
  }
}

/** A stable, cacheable system prompt block. */
function cachedSystem(text: string): Anthropic.TextBlockParam[] {
  return [{ type: 'text', text, cache_control: { type: 'ephemeral' } }]
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

export const anthropicProvider: AIProvider = {
  name: 'anthropic',

  isConfigured() {
    return !!process.env.ANTHROPIC_API_KEY
  },

  async explain(input: ExplainInput): Promise<ProviderTextResult> {
    const res = await client().messages.create({
      model: EXPLAIN_MODEL,
      max_tokens: 500,
      temperature: 0.3,
      system: cachedSystem(EXPLAIN_SYSTEM),
      messages: [{ role: 'user', content: buildExplainUser(input) }],
    })
    return { text: extractText(res.content), model: EXPLAIN_MODEL, usage: usageFrom(res.usage) }
  },

  async followUp(input: FollowUpInput): Promise<ProviderTextResult> {
    const res = await client().messages.create({
      model: FOLLOWUP_MODEL,
      max_tokens: 500,
      temperature: 0.5,
      system: cachedSystem(FOLLOWUP_SYSTEM),
      messages: [{ role: 'user', content: buildFollowUpUser(input) }],
    })
    return { text: extractText(res.content), model: FOLLOWUP_MODEL, usage: usageFrom(res.usage) }
  },

  async mark(input: MarkInput): Promise<ProviderMarkResult> {
    const res = await client().messages.create({
      model: MARKING_MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: cachedSystem(MARK_SYSTEM),
      tools: [
        {
          name: MARK_TOOL_NAME,
          description: 'Submit the marking assessment for the student answer.',
          input_schema: MARK_TOOL_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: MARK_TOOL_NAME },
      messages: [{ role: 'user', content: buildMarkUser(input) }],
    })

    const toolUse = res.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === MARK_TOOL_NAME,
    )
    if (!toolUse) {
      throw new AIError('Marking model did not return a tool call.', 'invalid_output')
    }
    const result = parseMarkResult(toolUse.input, input.maxMarks)
    return { result, model: MARKING_MODEL, usage: usageFrom(res.usage) }
  },
}

/** Exposed for the CLI / admin display. */
export const ANTHROPIC_MODELS = {
  explain: EXPLAIN_MODEL,
  followup: FOLLOWUP_MODEL,
  marking: MARKING_MODEL,
}
