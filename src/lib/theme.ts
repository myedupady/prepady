/**
 * PREPADY THEME REGISTER (programmatic mirror)
 * ============================================================================
 * The RUNTIME source of truth is `src/app/(frontend)/globals.css` (CSS vars),
 * which `tailwind.config.ts` maps to utility classes. Use Tailwind classes in
 * components — `bg-brand-600`, `text-gold-500`, `bg-card`, `border-border`, etc.
 *
 * This file mirrors those values for JS-only contexts that can't read Tailwind
 * classes: chart libraries (Recharts), <canvas>, dynamic inline styles, OG
 * images, emails. Values are HSL channel triplets identical to globals.css —
 * if you change a colour there, update it here too.
 *
 * Scheme: "Indigo & Gold" — premium, achievement-oriented, deliberately
 * distinct from any green/orange branding.
 */

/** Brand — deep indigo / violet (primary identity). */
export const BRAND = {
  50: '250 100% 97%',
  100: '251 96% 93%',
  200: '251 95% 87%',
  300: '252 92% 78%',
  400: '253 89% 70%',
  500: '254 84% 63%',
  600: '255 70% 55%', // primary
  700: '256 58% 47%',
  800: '257 53% 38%',
  900: '256 46% 28%',
  950: '257 50% 18%',
} as const

/** Gold — warm amber accent (achievement / premium). */
export const GOLD = {
  50: '45 100% 96%',
  100: '45 97% 88%',
  200: '44 96% 77%',
  300: '43 95% 66%',
  400: '42 95% 56%',
  500: '40 94% 49%', // accent
  600: '35 92% 44%', // gold CTA
  700: '30 85% 37%',
  800: '27 75% 31%',
  900: '25 68% 26%',
  950: '24 72% 15%',
} as const

/** Neutral — cool slate (text & surfaces). */
export const NEUTRAL = {
  50: '210 40% 98%',
  100: '214 32% 95%',
  200: '213 27% 90%',
  300: '213 20% 82%',
  400: '215 16% 64%',
  500: '215 16% 47%',
  600: '215 19% 35%',
  700: '215 25% 27%',
  800: '217 33% 17%',
  900: '222 47% 11%',
  950: '229 53% 7%',
} as const

/**
 * Semantic roles → the CSS variable each maps to. Read the live (theme-aware,
 * light/dark) value at runtime via `cssVar(name)`.
 */
export const SEMANTIC = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  border: '--border',
  ring: '--ring',
  destructive: '--destructive',
  success: '--success',
  warning: '--warning',
  info: '--info',
} as const

/** Resolve a CSS variable to a usable color string, e.g. cssVar('--brand-600'). */
export const cssVar = (name: string) => `hsl(var(${name}))`

/** Brand/gold/neutral shade as a live color string for JS consumers. */
export const brand = (shade: keyof typeof BRAND) => cssVar(`--brand-${shade}`)
export const gold = (shade: keyof typeof GOLD) => cssVar(`--gold-${shade}`)
export const neutral = (shade: keyof typeof NEUTRAL) => cssVar(`--neutral-${shade}`)

/** Static `hsl(...)` string (theme-independent) — for OG images / emails where CSS vars don't resolve. */
export const hsl = (triplet: string) => `hsl(${triplet})`

/**
 * Usage cheat-sheet (Tailwind classes):
 *   Primary action      → bg-brand-600 hover:bg-brand-700 text-white
 *   Accent / highlight   → bg-gold-500 / text-gold-500
 *   Hero / dark sections → bg-brand-900 text-white
 *   Surfaces             → bg-background / bg-card / bg-muted
 *   Body text            → text-foreground ; secondary → text-muted-foreground
 *   Borders              → border-border ; focus ring → ring-ring
 *   States               → text-success / text-warning / text-destructive / text-info
 */
const theme = { BRAND, GOLD, NEUTRAL, SEMANTIC, cssVar, brand, gold, neutral, hsl }
export default theme
