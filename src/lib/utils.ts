import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * @deprecated Use formatPrice() with the user's DisplayCurrency instead.
 * Kept temporarily for components not yet migrated.
 */
export function formatNaira(amount: number): string {
  return formatPrice(amount, 'USD')
}

/** Extract YouTube video ID from a URL */
export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

/** Build an embeddable player URL for a YouTube or Vimeo link (null if neither). */
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = getYouTubeId(url)
  if (yt) return `https://www.youtube.com/embed/${yt}`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

/** Get YouTube thumbnail URL from video ID */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default' | 'hq' | 'maxres' = 'hq',
): string {
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    maxres: 'maxresdefault',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

/** Generate a unique order number */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `MED-${timestamp}-${random}`
}

/**
 * Resolve the display name of a Payload relationship value, which may be a bare
 * ID (unpopulated) or a populated doc. Returns null when no name is available.
 */
export function relName(value: unknown): string | null {
  if (value && typeof value === 'object' && 'name' in value) {
    const n = (value as { name?: unknown }).name
    return typeof n === 'string' ? n : null
  }
  return null
}

/** Slugify a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Truncate text to a max length */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trimEnd() + '...'
}

/** Format a date for display */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

// ---------------------------------------------------------------------------
// Legacy Paystack amount helpers — kept for reference only.
// The app now uses Flutterwave, which accepts actual currency amounts
// (USD / GBP) directly — no kobo conversion is required.
// ---------------------------------------------------------------------------

/** @deprecated Paystack only — no longer used. Flutterwave accepts actual amounts. */
export const PAYSTACK_USD_TO_NGN = 1650

/** @deprecated Paystack only — Flutterwave does not use kobo. */
export function usdToPaystackKobo(usd: number): number {
  return Math.round(usd * PAYSTACK_USD_TO_NGN * 100)
}

/** @deprecated Alias for backwards compatibility. */
export const nairaToKobo = usdToPaystackKobo

/** @deprecated Paystack only — Flutterwave does not use kobo. */
export function paystackKoboToUsd(kobo: number): number {
  return kobo / 100 / PAYSTACK_USD_TO_NGN
}

/** @deprecated Alias for backwards compatibility. */
export const koboToNaira = paystackKoboToUsd

// ---------------------------------------------------------------------------
// Multi-currency pricing (USD base, same value shown in £ for UK visitors)
// ---------------------------------------------------------------------------

export type DisplayCurrency = 'GBP' | 'USD'

/**
 * Format a USD price for display.
 * UK visitors (detected via Vercel's x-vercel-ip-country header → middleware cookie)
 * see the identical number in pound sterling — e.g. $25 → £25.
 * All other visitors see US dollars.
 *
 * The same numerical value is used for both currencies intentionally:
 * this is a pricing decision, not a currency conversion.
 */
export function formatPrice(amount: number, currency: DisplayCurrency = 'USD'): string {
  return new Intl.NumberFormat(currency === 'GBP' ? 'en-GB' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Safely parse the `preferred-currency` cookie value. Defaults to GBP. */
export function getCurrencyFromCookie(value: string | undefined): DisplayCurrency {
  return value === 'GBP' ? 'GBP' : 'USD'
}
