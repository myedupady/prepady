import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { User } from '@/payload-types'

/**
 * Single source of truth for server-side auth. Uses Payload's real token
 * verification (signature + user lookup) via the request cookies — the SAME
 * check the API routes use — so pages and actions never disagree.
 *
 * Returns the fully-loaded user (or null) plus a ready payload instance, so
 * callers don't need a second getPayload/findByID.
 */
export async function getAuthContext(): Promise<{
  payload: Awaited<ReturnType<typeof getPayload>>
  user: User | null
}> {
  const payload = await getPayload({ config: configPromise })
  try {
    const headers = (await nextHeaders()) as unknown as Headers
    const { user } = await payload.auth({ headers })
    return { payload, user: (user as User) ?? null }
  } catch {
    return { payload, user: null }
  }
}
