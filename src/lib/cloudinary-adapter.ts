/**
 * Cloudinary adapter for @payloadcms/plugin-cloud-storage.
 *
 * Handles upload, delete, URL generation and static serving for all media
 * uploaded through the Payload CMS admin.  The Cloudinary public_id for each
 * file is  <folder>/<filename-without-extension>  so the stored filename in
 * Payload's database maps 1-to-1 to the Cloudinary asset.
 */

import { v2 as cloudinary } from 'cloudinary'
import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'

// Initialise once — env vars are read at import time (server only).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Strip the extension from a filename so we can use it as a Cloudinary public_id.
 * Cloudinary stores the extension separately.
 *   "hero-image.jpg"  →  "hero-image"
 */
function publicIdFromFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '')
}

/**
 * Build the Cloudinary public_id from folder prefix + filename.
 * The folder comes from the plugin options; the filename is whatever
 * Payload stored (which may include a disambiguating hash suffix).
 */
function buildPublicId(folder: string, filename: string): string {
  const base = publicIdFromFilename(filename)
  return folder ? `${folder}/${base}` : base
}

/**
 * Detect resource type from MIME type.
 * Cloudinary needs this for videos and raw files.
 */
function resourceType(mimeType: string): 'image' | 'video' | 'raw' {
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('image/')) return 'image'
  return 'raw'
}

/**
 * Detect Cloudinary resource type from file extension.
 * Used when only the filename is available (e.g. generateURL, staticHandler).
 */
function resourceTypeFromExt(filename: string): 'image' | 'video' | 'raw' {
  const ext = (filename.split('.').pop() ?? '').toLowerCase()
  if (['pdf', 'epub', 'mobi', 'doc', 'docx', 'txt', 'zip'].includes(ext)) return 'raw'
  if (['mp4', 'mov', 'avi', 'webm', 'ogg', 'mkv'].includes(ext)) return 'video'
  return 'image'
}

export interface CloudinaryAdapterOptions {
  /** Top-level Cloudinary folder for all uploads (default: "myedupady") */
  folder?: string
}

/**
 * generateFileURL factory for use in cloudStoragePlugin's collection options.
 *
 * Payload calls this to compute ALL virtual URL fields on upload documents:
 * the top-level `url`, `thumbnailURL`, and each size's `url`.  Without it,
 * Payload falls back to `/api/media/file/[filename]` (local static path)
 * which 404s when disableLocalStorage is true.
 */
export function createCloudinaryFileURL(rootFolder = 'myedupady') {
  return ({
    filename,
    prefix,
  }: {
    filename: string
    prefix?: string
  }): string => {
    const folder = [rootFolder, prefix].filter(Boolean).join('/')
    const publicId = buildPublicId(folder, filename)
    // Detect resource type from extension so PDFs/EPUBs get the correct 'raw' URL
    const rt = resourceTypeFromExt(filename)
    return cloudinary.url(publicId, { secure: true, resource_type: rt })
  }
}

export function createCloudinaryAdapter(
  options: CloudinaryAdapterOptions = {},
): Adapter {
  const rootFolder = options.folder ?? 'myedupady'

  return ({ prefix = '' }): GeneratedAdapter => {
    // Collection-specific sub-folder: rootFolder/collectionPrefix
    const folder = [rootFolder, prefix].filter(Boolean).join('/')

    return {
      name: 'cloudinary',

      // ── URL generation ─────────────────────────────────────────────────────
      // Called by Payload whenever it needs to build the public URL for a file.
      // We reconstruct the Cloudinary delivery URL from the stored filename.
      generateURL: ({ filename }) => {
        const publicId = buildPublicId(folder, filename)
        const rt = resourceTypeFromExt(filename)
        return cloudinary.url(publicId, { secure: true, resource_type: rt })
      },

      // ── Upload ─────────────────────────────────────────────────────────────
      // Receives the raw file buffer from Payload after it has processed the
      // upload (resizing, Sharp processing, etc.).  We stream it to Cloudinary
      // and return the (potentially renamed) filename so Payload stores it.
      handleUpload: async ({ data, file }) => {
        const { buffer, filename, mimeType: mime } = file

        await new Promise<void>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              // Use the filename (without extension) as the public_id so the
              // Cloudinary asset is identifiable and the URL is predictable.
              public_id: publicIdFromFilename(filename),
              resource_type: resourceType(mime),
              overwrite: true,
            },
            (error, result) => {
              if (error || !result) {
                return reject(error ?? new Error('Cloudinary upload returned no result'))
              }
              resolve()
            },
          )
          uploadStream.end(buffer)
        })

        return data
      },

      // ── Delete ─────────────────────────────────────────────────────────────
      handleDelete: async ({ filename }) => {
        const publicId = buildPublicId(folder, filename)
        try {
          await cloudinary.uploader.destroy(publicId, { invalidate: true })
        } catch (err) {
          // Log but don't throw — a missing asset shouldn't block record deletion.
          console.error('[cloudinary] delete failed for', publicId, err)
        }
      },

      // ── Static handler ─────────────────────────────────────────────────────
      // Payload calls this when a file is requested via the Payload static URL.
      // We simply redirect to the Cloudinary delivery URL.
      staticHandler: (_req, { params: { filename } }) => {
        const publicId = buildPublicId(folder, filename)
        const rt = resourceTypeFromExt(filename)
        const url = cloudinary.url(publicId, { secure: true, resource_type: rt })
        return Response.redirect(url, 302)
      },
    }
  }
}
