import pg from 'pg'

const { Pool } = pg

// Expect DATABASE_URL provided by Railway
const connectionString = process.env.DATABASE_URL

let pool
if (connectionString) {
  pool = new Pool({
    connectionString,
    // Enable SSL on managed Postgres (Railway usually supports no-verify)
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT || 5000),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || 30000),
    max: Number(process.env.PG_MAX_CLIENTS || 10),
  })
}

export async function query(text, params) {
  if (!pool) throw new Error('DATABASE_URL not configured')
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.LOG_SQL) {
    console.log('executed query', { text, duration, rows: res.rowCount })
  }
  return res
}
