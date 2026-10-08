/**
 * Quiz engine helpers — pure functions, shared across API routes.
 * Lifted and generalised from the proven Myedupady adaptive engine.
 */

export type Difficulty = 1 | 2 | 3

/** Fisher–Yates shuffle (non-mutating). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Adaptive difficulty update: level up after a streak of correct answers,
 * drop a level on a wrong answer.
 */
export function updateDifficulty(
  isCorrect: boolean,
  current: Difficulty,
  correctStreak: number,
  streakToLevelUp = 2,
): { difficulty: Difficulty; correctStreak: number } {
  if (isCorrect) {
    const newStreak = correctStreak + 1
    if (newStreak >= streakToLevelUp) {
      return { difficulty: Math.min(3, current + 1) as Difficulty, correctStreak: 0 }
    }
    return { difficulty: current, correctStreak: newStreak }
  }
  return { difficulty: Math.max(1, current - 1) as Difficulty, correctStreak: 0 }
}

/** Case-insensitive, whitespace-normalised MCQ answer check. */
export function isCorrectAnswer(given: string, correct: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
  return norm(given) === norm(correct)
}

/**
 * Whether a user currently has premium access (active plan + unexpired sub).
 * Free users fall back to the metered daily AI limit.
 */
export function isPremium(user: {
  plan?: string | null
  subscriptionExpiresAt?: string | null
}): boolean {
  if (user.plan !== 'premium') return false
  if (!user.subscriptionExpiresAt) return true
  return new Date(user.subscriptionExpiresAt).getTime() > Date.now()
}

/** Free-tier daily allowance for live AI follow-ups (stored explanations are always free). */
export const FREE_DAILY_AI_LIMIT = 5

/** Daily essay-marking cap for premium users (abuse guard; free users can't mark). */
export const PREMIUM_MARK_DAILY_LIMIT = 20

/**
 * Whether this user must confirm their email before using live AI. Controlled by
 * AI_REQUIRE_VERIFIED_EMAIL (default off, so existing/dev flows are unaffected).
 * Admins are always exempt. Stored explanations are never gated — only live calls.
 */
export function needsEmailVerification(user: { emailVerified?: boolean | null; role?: string | null }): boolean {
  if (process.env.AI_REQUIRE_VERIFIED_EMAIL !== 'true') return false
  if (user.role === 'admin') return false
  return !user.emailVerified
}

/**
 * Compute a user's usage against a daily counter, rolling it over at UTC-local
 * midnight (toDateString boundary). Pure — the caller persists the increment.
 */
export function dailyUsage(
  resetAt: string | null | undefined,
  usedToday: number | null | undefined,
  now: Date = new Date(),
): { isNewDay: boolean; usedToday: number } {
  const isNewDay = !resetAt || new Date(resetAt).toDateString() !== now.toDateString()
  return { isNewDay, usedToday: isNewDay ? 0 : (usedToday ?? 0) }
}

export interface ClientQuestion {
  id: number | string
  questionText: string
  options: { text: string }[]
  difficulty: string | number
  points: number
  questionImageUrl?: string | null
}

/** Strip correctAnswer/explanation before sending a question to the client (anti-cheat). */
export function sanitiseQuestion(q: Record<string, unknown>): ClientQuestion {
  const img = q.questionImage as { url?: string } | null | undefined
  const opts = Array.isArray(q.options) ? (q.options as Array<{ text?: string }>) : []
  return {
    id: q.id as number,
    questionText: String(q.questionText ?? ''),
    options: opts.map((o) => ({ text: o.text ?? '' })).filter((o) => o.text),
    difficulty: (q.difficulty as string) ?? '2',
    points: (q.maxMarks as number) ?? 1,
    questionImageUrl: img?.url ?? null,
  }
}
