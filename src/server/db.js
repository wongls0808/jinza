import pg from 'pg'

const { Pool } = pg

// Expect DATABASE_URL provided by Railway
const connectionString = process.env.DATABASE_URL

export const pool = new Pool({
  connectionString,
  // Enable SSL on managed Postgres (Railway usually supports no-verify)
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false }
})

export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.LOG_SQL) {
    console.log('executed query', { text, duration, rows: res.rowCount })
  }
  return res
}
