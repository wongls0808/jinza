#!/usr/bin/env node
/*
 Simple PostgreSQL migration runner for this project.
 - Runs .sql files in the migrations/ folder in lexicographic order
 - Stores applied filenames in schema_migrations table
 - Safe to re-run (skips already applied)
 Usage (PowerShell):
   $env:DATABASE_URL="postgres://user:pass@host:5432/db"; node scripts/migrate.js
*/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query, closePool } from '../src/server/db.js'
import { ensureSchema } from '../src/server/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function ensureMigrationsTable() {
  await query(`
    create table if not exists schema_migrations (
      id serial primary key,
      filename text unique not null,
      applied_at timestamptz default now()
    );
  `)
}

async function getApplied() {
  try {
    const rs = await query('select filename from schema_migrations order by id')
    const set = new Set(rs.rows.map(r => r.filename))
    return set
  } catch (e) {
    // If table not found, create then return empty
    if (e && (e.code === '42P01' || /schema_migrations/.test(e.message))) {
      await ensureMigrationsTable()
      return new Set()
    }
    throw e
  }
}

async function applySql(file, sql) {
  // Split by ; but preserve inside function bodies (very simple heuristic)
  // For our repo, we run as a single batch.
  await query(sql)
  await query('insert into schema_migrations(filename) values($1) on conflict(filename) do nothing', [file])
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL is not set.')
    process.exit(1)
  }
  const dir = path.join(__dirname, '..', 'migrations')
  // Ensure baseline schema (users, permissions, banks, currencies, etc.)
  await ensureSchema()
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
  const applied = await getApplied()
  let appliedCount = 0
  for (const f of files) {
    if (applied.has(f)) { continue }
    const fp = path.join(dir, f)
    const sql = fs.readFileSync(fp, 'utf8')
    process.stdout.write(`Applying ${f}... `)
    try {
      await applySql(f, sql)
      appliedCount++
      console.log('OK')
    } catch (e) {
      console.error(`FAILED: ${e.message}`)
      process.exitCode = 2
      break
    }
  }
  console.log(`Migrations complete. Applied ${appliedCount} new migration(s).`)
  await closePool()
}

main().catch(async (e) => {
  console.error('Migration runner crashed:', e)
  await closePool()
  process.exit(2)
})
