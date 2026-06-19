import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Prepady — AI Exam Prep for WAEC, NECO, JAMB & more',
  description:
    'Adaptive practice tests, real past questions, and an AI tutor that explains every question — for WAEC, NECO, JAMB, Post-UTME, IGCSE and A-Level.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-foreground bg-background">{children}</body>
    </html>
  )
}
