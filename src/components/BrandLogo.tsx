/**
 * The Prepady brand mark (the P-with-arrow logo) for header lockups across the
 * app, so every page shows the real logo rather than a generic placeholder icon.
 * Plain markup — safe to use from both server and client components.
 */
export function BrandLogo({ className = 'w-7 h-7' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="Prepady" className={`${className} object-contain`} />
}
