import type { GlobalConfig } from 'payload'

const color = (name: string, label: string, defaultValue: string, description: string) => ({
  name,
  type: 'text' as const,
  required: true,
  label,
  defaultValue,
  admin: {
    description: `${description} — hex, e.g. ${defaultValue}.`,
    components: { Field: '/src/components/admin/ColorField.tsx#ColorField' },
  },
})

/**
 * Site colour theme — admin-editable, no deploy needed.
 *
 * These map to the core CSS variables in globals.css; the frontend layout reads
 * this global and injects `:root { … }` overrides at render time. Because every
 * component uses `hsl(var(--token))`, changing a colour here re-themes the whole
 * site. (The full numeric ramps live in the register; this exposes the key
 * tokens. Region chip colours are edited on each Region.)
 */
export const Theme: GlobalConfig = {
  slug: 'theme',
  label: 'Theme & Colours',
  admin: {
    group: 'Settings',
    description:
      'The site’s core colours. Changes apply on the next page load. Region chip colours are set on each Region.',
  },
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    color('background', 'Background (cream)', '#F6F2E9', 'Page canvas'),
    color('foreground', 'Text (ink)', '#201B15', 'Main text colour'),
    color('primary', 'Primary buttons (ink)', '#201B15', 'Solid/primary buttons'),
    color('primaryForeground', 'Primary button text', '#F7F3EA', 'Text on primary buttons'),
    color('accent', 'Accent / CTA (gold)', '#F2A33C', 'Gold accents, CTAs, highlights'),
    color('card', 'Card surface', '#FBF8F1', 'Cards and raised surfaces'),
    color('border', 'Borders', '#E7E0D2', 'Hairline borders and inputs'),
  ],
}
