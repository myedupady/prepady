/**
 * Colour helpers for the admin-editable theme.
 *
 * The token register stores colours as HSL channel triplets (so Tailwind's
 * `hsl(var(--x) / <alpha>)` mapping works). The admin edits friendly hex values,
 * so we convert hex → "H S% L%" at render time when injecting the :root overrides.
 */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

function parseHex(hex: string): [number, number, number] | null {
  if (!hex || !HEX_RE.test(hex.trim())) return null
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** "#F6F2E9" → "41 38% 94%" (the HSL channel triplet our CSS vars expect). Null on bad input. */
export function hexToHslTriplet(hex: string): string | null {
  const rgb = parseHex(hex)
  if (!rgb) return null
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/** "#E11D48", 0.13 → "rgba(225, 29, 72, 0.13)" — for soft region-chip backgrounds. */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return `rgba(0,0,0,${alpha})`
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}
