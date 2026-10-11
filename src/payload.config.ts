import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { createCloudinaryAdapter, createCloudinaryFileURL } from './lib/cloudinary-adapter'
import { payloadEmailAdapter } from './lib/payload-email'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Regions } from './collections/Regions'
import { Exams } from './collections/Exams'
import { Subjects } from './collections/Subjects'
import { Topics } from './collections/Topics'
import { Questions } from './collections/Questions'
import { QuizSessions } from './collections/QuizSessions'
import { Theme } from './globals/Theme'
import { AIControls } from './globals/AIControls'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Trusted origins for CORS + CSRF. We include BOTH the apex and www variants of
 * NEXT_PUBLIC_SERVER_URL (so cookie auth works whether a visitor lands on
 * prepady.com or www.prepady.com), the Vercel production URL, and localhost.
 * This prevents the "logged in but bounced to login" split between www and apex.
 */
function trustedOrigins(): string[] {
  const out = new Set<string>(['http://localhost:3000'])
  const add = (url?: string) => {
    if (!url) return
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`)
      const bare = u.host.replace(/^www\./, '')
      out.add(`${u.protocol}//${bare}`)
      out.add(`${u.protocol}//www.${bare}`)
    } catch {
      /* ignore malformed */
    }
  }
  add(process.env.NEXT_PUBLIC_SERVER_URL)
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  add(process.env.VERCEL_URL)
  return [...out]
}
const ORIGINS = trustedOrigins()

// Cloudinary (under a "prepady/" subfolder of the shared account) is used when
// its credentials are present; otherwise media falls back to local-disk storage.
const plugins = process.env.CLOUDINARY_CLOUD_NAME
  ? [
      cloudStoragePlugin({
        collections: {
          media: {
            adapter: createCloudinaryAdapter({ folder: 'prepady' }),
            generateFileURL: createCloudinaryFileURL('prepady'),
            disableLocalStorage: true,
          },
        },
      }),
    ]
  : []

export default buildConfig({
  plugins,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Prepady Admin',
    },
  },
  collections: [Users, Media, Regions, Exams, Subjects, Topics, Questions, QuizSessions],
  globals: [Theme, AIControls],
  editor: lexicalEditor({}),
  email: payloadEmailAdapter(),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Dev auto-syncs the schema (fast iteration); production applies committed
    // migrations instead of pushing. Run `pnpm migrate` on deploy. See docs/DEPLOYMENT.md.
    push: process.env.NODE_ENV !== 'production',
  }),
  sharp,
  // Media → Cloudinary ("prepady/" folder) when CLOUDINARY_* creds are set
  // (see `plugins` above); otherwise local-disk for zero-config dev.
  cors: ORIGINS,
  csrf: ORIGINS,
})
