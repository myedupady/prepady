import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary (when cloud media storage is added — see README roadmap)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // YouTube thumbnails (Phase 2 concept videos)
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
}

export default withPayload(nextConfig)
