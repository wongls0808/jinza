#!/usr/bin/env node
import { reseedPermissions } from '../src/server/permissions.js'
import { ensureSchema } from '../src/server/auth.js'
import { closePool } from '../src/server/db.js'

async function main() {
  try {
    await ensureSchema()
    const reset = process.argv.includes('--reset')
    const r = await reseedPermissions({ reset })
    console.log(`[seed-permissions] done`, r)
    process.exitCode = 0
  } catch (e) {
    console.error(`[seed-permissions] failed:`, e?.message || e)
    process.exitCode = 1
  } finally {
    await closePool()
  }
}

main()
