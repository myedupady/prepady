import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Subjects } from './collections/Subjects'
import { Questions } from './collections/Questions'
import { QuizSessions } from './collections/QuizSessions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Prepady Admin',
    },
  },
  collections: [Users, Media, Subjects, Questions, QuizSessions],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  // Media uses Payload's local storage by default for the MVP.
  // Swap in @payloadcms/plugin-cloud-storage (Cloudinary/S3/Vercel Blob) before
  // production so uploads survive serverless cold starts — see README roadmap.
  cors: [process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'].filter(Boolean),
})
