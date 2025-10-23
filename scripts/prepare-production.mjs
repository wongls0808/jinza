#!/usr/bin/env node
/*
 Prepare-production script
 - Validates environment for production
 - Runs DB migrations
 - Optionally cleans obvious test data (dry-run by default)
 Usage (PowerShell):
   $env:DATABASE_URL="postgres://user:pass@host:5432/db"; node scripts/prepare-production.mjs --apply --purge-sessions --remove-demo-data
 Flags:
   --apply                Actually execute cleanup actions (otherwise only print SQL and counts)
   --purge-sessions       Delete all active sessions (force re-login)
   --remove-demo-data     Remove demo data created by scripts/create-test-data.mjs
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import { query, closePool } from '../src/server/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function log(title, msg) {
  const t = new Date().toISOString()
  console.log(`[${t}] ${title}: ${msg}`)
}

function assertEnv() {
  const errs = []
  const warn = []
  const v = (k) => (process.env[k] || '').trim()

  if (!v('DATABASE_URL')) errs.push('DATABASE_URL is required')
  if (!v('JWT_SECRET') || v('JWT_SECRET').length < 24) warn.push('JWT_SECRET is too short (<24). Set a strong secret (32+).')
  if (!v('DATA_DIR')) warn.push('DATA_DIR not set (will fall back to server dir). Recommended to mount persistent volume.')
  if (v('AUTH_BYPASS') === '1') warn.push('AUTH_BYPASS=1 is enabled. Disable in production.')
  if (v('PERM_UI_ONLY') === '1') warn.push('PERM_UI_ONLY=1 is enabled. Disable in production.')
  if (v('ALLOW_TRANSACTIONS_MOCK') === '1') warn.push('ALLOW_TRANSACTIONS_MOCK=1 is enabled. Disable in production.')
  if (v('BACKUP_ENABLED') !== '1') warn.push('BACKUP_ENABLED is not 1. Daily auto-backup will not run.')
  if (!v('BACKUP_SCHEDULE')) warn.push('BACKUP_SCHEDULE not set. Default 02:30 will be used.')
  if (!v('BACKUP_RETENTION_DAYS')) warn.push('BACKUP_RETENTION_DAYS not set. Default 7 days will be used.')

  if (errs.length) {
    console.error('Fatal env missing:')
    errs.forEach(e => console.error(' -', e))
    process.exit(1)
  }
  if (warn.length) {
    console.warn('Env warnings:')
    warn.forEach(w => console.warn(' -', w))
  }
}

async function runMigrations() {
  log('migrate', 'running migrations')
  const res = spawnSync(process.execPath, [path.join(__dirname, 'migrate.js')], { stdio: 'inherit', env: process.env })
  if (res.status !== 0) {
    console.error('Migration failed with code', res.status)
    process.exit(res.status || 2)
  }
}

function hasFlag(name) { return process.argv.includes(name) }

async function cleanup({ apply, purgeSessions, removeDemo }) {
  const actions = []
  if (purgeSessions) {
    actions.push({
      desc: 'Purge all user sessions',
      sql: 'delete from user_sessions',
    })
  }
  if (removeDemo) {
    // Matches data created by scripts/create-test-data.mjs
    actions.push({
      desc: 'Remove demo transactions (create-test-data.mjs)',
      sql: `delete from transactions where account_number='6226123456789001' and cheque_ref_no like 'REF100%'`,
      countSql: `select count(*) from transactions where account_number='6226123456789001' and cheque_ref_no like 'REF100%'`
    })
  }
  if (!actions.length) return

  for (const a of actions) {
    if (a.countSql) {
      try {
        const c = await query(a.countSql)
        const n = Number(c.rows?.[0]?.count || 0)
        log('cleanup', `${a.desc}: ${n} rows`)
      } catch (e) { log('cleanup', `${a.desc}: count failed ${e.message}`) }
    } else {
      log('cleanup', a.desc)
    }
    if (apply) {
      try { await query(a.sql); log('apply', `${a.desc}: done`) } catch (e) { console.error('apply failed:', e.message) }
    } else {
      if (a.sql) console.log('SQL ->', a.sql)
    }
  }
}

async function main() {
  assertEnv()
  await runMigrations()
  await cleanup({
    apply: hasFlag('--apply'),
    purgeSessions: hasFlag('--purge-sessions'),
    removeDemo: hasFlag('--remove-demo-data')
  })
  await closePool()
  log('done', 'production preparation complete')
}

main().catch(async (e) => { console.error(e); await closePool(); process.exit(2) })
