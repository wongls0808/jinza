const { Pool } = require("pg");

let pool = null;
let dbAvailable = false;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return null;
    }
    /* Railway 内网(*.railway.internal)不需要 SSL；
       外网连接默认开启 SSL（rejectUnauthorized: false） */
    const isInternal = connectionString.includes(".railway.internal");
    const sslOpt = process.env.DB_SSL === "false" || isInternal
      ? false
      : { rejectUnauthorized: false };
    pool = new Pool({
      connectionString,
      ssl: sslOpt,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    pool.on("error", (err) => {
      console.error("PostgreSQL pool error:", err.message);
    });
  }
  return pool;
}

function isDbAvailable() {
  return dbAvailable;
}

/* ────────────────── 建表 ────────────────── */

async function initTables() {
  const db = getPool();
  if (!db) {
    console.log("DATABASE_URL not set, database features disabled.");
    return;
  }
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_config (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS sync_state (
      entity TEXT PRIMARY KEY,
      last_sync TIMESTAMPTZ,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);
  /* sync_data: 存储 AutoCount 同步来的实体数据（整批存储，按实体名区分） */
  await db.query(`
    CREATE TABLE IF NOT EXISTS sync_data (
      entity TEXT PRIMARY KEY,
      items  JSONB NOT NULL DEFAULT '[]'::jsonb,
      count  INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  /* purchase_pi: 本地 PI 数据，每条一行 */
  await db.query(`
    CREATE TABLE IF NOT EXISTS purchase_pi (
      id         SERIAL PRIMARY KEY,
      doc_no     TEXT NOT NULL UNIQUE,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  dbAvailable = true;
  console.log("Database tables initialized.");
}

/* ────────────────── app_config ────────────────── */

async function getConfig(key) {
  const db = getPool();
  const { rows } = await db.query(
    "SELECT value FROM app_config WHERE key = $1",
    [key]
  );
  return rows.length ? rows[0].value : null;
}

async function setConfig(key, value) {
  const db = getPool();
  await db.query(
    `INSERT INTO app_config (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key)
     DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

/* ────────────────── sync_state ────────────────── */

async function getSyncState() {
  const db = getPool();
  const { rows } = await db.query("SELECT entity, last_sync, meta FROM sync_state");
  const result = {};
  for (const r of rows) {
    result[r.entity] = { lastSync: r.last_sync, ...r.meta };
  }
  return result;
}

async function setSyncState(entity, lastSync, meta = {}) {
  const db = getPool();
  await db.query(
    `INSERT INTO sync_state (entity, last_sync, meta)
     VALUES ($1, $2, $3)
     ON CONFLICT (entity)
     DO UPDATE SET last_sync = $2, meta = $3`,
    [entity, lastSync, JSON.stringify(meta)]
  );
}

/* ────────────────── sync_data (实体数据) ────────────────── */

async function getSyncData(entity) {
  const db = getPool();
  const { rows } = await db.query(
    "SELECT items FROM sync_data WHERE entity = $1",
    [entity]
  );
  return rows.length ? rows[0].items : [];
}

async function getAllSyncData() {
  const db = getPool();
  const { rows } = await db.query("SELECT entity, items FROM sync_data");
  const result = {};
  for (const r of rows) {
    result[r.entity] = r.items;
  }
  return result;
}

async function setSyncData(entity, items) {
  const db = getPool();
  const count = Array.isArray(items) ? items.length : 0;
  await db.query(
    `INSERT INTO sync_data (entity, items, count, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (entity)
     DO UPDATE SET items = $2, count = $3, updated_at = NOW()`,
    [entity, JSON.stringify(items), count]
  );
}

/* ────────────────── purchase_pi (本地 PI) ────────────────── */

async function getAllPurchasePI() {
  const db = getPool();
  const { rows } = await db.query(
    "SELECT data FROM purchase_pi ORDER BY created_at DESC"
  );
  return rows.map((r) => r.data);
}

async function addPurchasePI(docNo, data) {
  const db = getPool();
  await db.query(
    `INSERT INTO purchase_pi (doc_no, data, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (doc_no)
     DO UPDATE SET data = $2, updated_at = NOW()`,
    [docNo, JSON.stringify(data)]
  );
}

async function deletePurchasePI(docNo) {
  const db = getPool();
  await db.query("DELETE FROM purchase_pi WHERE doc_no = $1", [docNo]);
}

/* ────────────────── exports ────────────────── */

module.exports = {
  getPool,
  isDbAvailable,
  initTables,
  getConfig,
  setConfig,
  getSyncState,
  setSyncState,
  getSyncData,
  getAllSyncData,
  setSyncData,
  getAllPurchasePI,
  addPurchasePI,
  deletePurchasePI
};
