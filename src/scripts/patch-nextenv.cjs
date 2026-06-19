/**
 * Node.js 24 + tsx CJS compatibility patch for @next/env
 *
 * Problem: tsx's esbuild CJS transformer converts Payload's ESM-syntax `loadEnv.js`
 * to require('@next/env'). The @next/env package sets __esModule:true without a
 * .default export. esbuild's __toESM() sees __esModule:true and skips adding .default,
 * so `import_env.default` ends up undefined.
 *
 * Fix: intercept the require('@next/env') call and strip __esModule so __toESM()
 * wraps the module correctly, making `.default` point to the real exports object.
 *
 * Also pre-loads .env.local / .env so PAYLOAD_SECRET etc. are available before
 * Payload initialises (Payload's own loadEnvConfig can't run without this patch).
 */

const path = require('path')
const fs = require('fs')

// --- Load env files in priority order (same as Next.js) ---
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const raw = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    const value = raw.replace(/^(['"`])(.*)\1$/, '$2')
    // Don't override already-set env vars
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

const root = path.resolve(__dirname, '..', '..')
loadEnvFile(path.join(root, '.env.local'))
loadEnvFile(path.join(root, '.env'))
loadEnvFile(path.join(root, '.env.development.local'))
loadEnvFile(path.join(root, '.env.development'))

// --- Patch @next/env Module._load ---
const Module = require('module')
const originalLoad = Module._load.bind(Module)

Module._load = function (id, parent, isMain) {
  const mod = originalLoad(id, parent, isMain)

  if (id === '@next/env') {
    if (mod && mod.__esModule === true && typeof mod.default === 'undefined') {
      // Remove __esModule flag — esbuild's __toESM will now add .default = mod
      const { __esModule: _dropped, ...rest } = mod
      return rest
    }
  }

  return mod
}
