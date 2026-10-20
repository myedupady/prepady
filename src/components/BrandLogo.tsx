import Image from 'next/image'

interface BrandLogoProps {
  className?: string
  size?: number
}

export function BrandLogo({ className = 'w-7 h-7', size = 48 }: BrandLogoProps) {
  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src="/icon-128.png"
        alt="Prepady Logo"
        width={size}
        height={size}
        className="object-contain w-full h-full"
        priority
      />
    </span>
  )
}
