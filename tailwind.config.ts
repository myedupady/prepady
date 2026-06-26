import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * Tailwind maps color utilities → CSS variables defined in
 * src/app/(frontend)/globals.css. globals.css is the SINGLE SOURCE OF TRUTH for
 * the palette; this file only wires names to it. Never hardcode a hex here —
 * change a value once, in globals.css, and the whole app follows.
 *
 * Premium scheme: "Indigo & Gold" — deep indigo `brand`, warm `gold` accent.
 * Every shade uses the `hsl(var(--x) / <alpha-value>)` form so opacity modifiers
 * (e.g. bg-brand-600/20) work everywhere.
 */
const withAlpha = (v: string) => `hsl(var(${v}) / <alpha-value>)`

const scale = (name: string) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [
      n,
      withAlpha(`--${name}-${n}`),
    ]),
  )

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand scales ──────────────────────────────────────────────────
        ink: { DEFAULT: withAlpha('--ink-900'), ...scale('ink') },
        gold: { DEFAULT: withAlpha('--gold-400'), ...scale('gold') },
        // ── Semantic (shadcn-style) tokens ──────────────────────────────────
        background: withAlpha('--background'),
        foreground: withAlpha('--foreground'),
        card: { DEFAULT: withAlpha('--card'), foreground: withAlpha('--card-foreground') },
        popover: { DEFAULT: withAlpha('--popover'), foreground: withAlpha('--popover-foreground') },
        primary: { DEFAULT: withAlpha('--primary'), foreground: withAlpha('--primary-foreground') },
        secondary: { DEFAULT: withAlpha('--secondary'), foreground: withAlpha('--secondary-foreground') },
        muted: { DEFAULT: withAlpha('--muted'), foreground: withAlpha('--muted-foreground') },
        accent: { DEFAULT: withAlpha('--accent'), foreground: withAlpha('--accent-foreground') },
        destructive: { DEFAULT: withAlpha('--destructive'), foreground: withAlpha('--destructive-foreground') },
        success: { DEFAULT: withAlpha('--success'), foreground: withAlpha('--success-foreground') },
        warning: { DEFAULT: withAlpha('--warning'), foreground: withAlpha('--warning-foreground') },
        info: { DEFAULT: withAlpha('--info'), foreground: withAlpha('--info-foreground') },
        border: withAlpha('--border'),
        input: withAlpha('--input'),
        ring: withAlpha('--ring'),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        heading: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Soft, premium elevation tinted warm (used via shadow-brand / -lg)
        brand: '0 12px 32px -14px hsl(var(--ink-900) / 0.18)',
        'brand-lg': '0 24px 60px -22px hsl(var(--ink-900) / 0.22)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config
