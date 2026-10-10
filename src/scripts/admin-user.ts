/**
 * Admin user utility — promote a user to admin, or reset a user's password.
 * Runs with the Payload local API so passwords are hashed correctly.
 *
 *   pnpm admin:promote <email>                 # make the user an admin (+ mark verified)
 *   pnpm admin:password <email> <newPassword>  # reset a user's password
 *
 * Uses the DATABASE_URI from your environment. Intended to be run by a project
 * owner from a trusted machine.
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function run() {
  const [command, email, password] = process.argv.slice(2)
  if (!command || !email) {
    console.error('Usage:\n  pnpm admin:promote <email>\n  pnpm admin:password <email> <newPassword>')
    process.exit(1)
  }

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({ collection: 'users', where: { email: { equals: email.toLowerCase() } }, limit: 1, overrideAccess: true })
  const user = found.docs[0]
  if (!user) {
    console.error(`✗ No user found with email "${email}".`)
    process.exit(1)
  }

  if (command === 'promote') {
    await payload.update({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
      data: { role: 'admin', emailVerified: true } as Record<string, unknown>,
    })
    console.log(`✓ ${email} is now an admin (and email-verified).`)
  } else if (command === 'password') {
    if (!password || password.length < 8) {
      console.error('✗ Provide a new password of at least 8 characters.')
      process.exit(1)
    }
    await payload.update({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
      data: { password } as Record<string, unknown>,
    })
    console.log(`✓ Password reset for ${email}.`)
  } else {
    console.error(`✗ Unknown command "${command}". Use "promote" or "password".`)
    process.exit(1)
  }
  process.exit(0)
}

run().catch((err) => {
  console.error('admin-user failed:', err)
  process.exit(1)
})
