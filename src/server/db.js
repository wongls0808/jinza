import pg from 'pg'

const { Pool } = pg

// 配置数据库连接
// 推荐仅通过环境变量 DATABASE_URL 指定连接串
// 可选：在本地开发时使用 DEV_LOCAL_DB 指定自定义连接串
let connectionString;
if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL;
} else if (process.env.DEV_LOCAL_DB) {
  connectionString = process.env.DEV_LOCAL_DB;
  console.log('使用 DEV_LOCAL_DB 作为开发数据库连接');
} else {
  connectionString = undefined; // 未配置数据库，将导致依赖 DB 的接口返回错误或回退到 mock（若开启）
}

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
  if (!pool) throw new Error('DATABASE_URL not configured: 请设置环境变量 DATABASE_URL 或 DEV_LOCAL_DB')
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.LOG_SQL) {
    console.log('executed query', { text, duration, rows: res.rowCount })
  }
  return res
}

// Acquire a dedicated client for transaction or batch operations
export async function withTransaction(fn) {
  if (!pool) throw new Error('DATABASE_URL not configured: 请设置环境变量 DATABASE_URL 或 DEV_LOCAL_DB')
  const client = await pool.connect()
  const start = Date.now()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    if (process.env.LOG_SQL) {
      console.log('tx committed', { duration: Date.now() - start })
    }
    return result
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    if (process.env.LOG_SQL) {
      console.log('tx rolled back', { err: e?.message, duration: Date.now() - start })
    }
    throw e
  } finally {
    client.release()
  }
}

export async function queryWithClient(client, text, params) {
  const res = await client.query(text, params)
  return res
}

// Gracefully close pool (for CLI tools like migrations)
export async function closePool() {
  if (pool) {
    await pool.end()
  }
}
