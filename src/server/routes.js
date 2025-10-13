import express from 'express'
import { parse as parseCsv } from 'csv-parse/sync'
import { authMiddleware, signToken, verifyPassword, hashPassword, validatePasswordStrength, requirePerm, ensureSchema } from './auth.js'
import { query } from './db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { parseCSV, removeDuplicates } from './utils.js'
import { transactionsRouter } from './transactions.js'
import { createTransactionsController } from './transactionsFallback.js'

export const router = express.Router()
const upload = multer({ dest: 'uploads/' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Auth
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' })
  const userRes = await query('select id, username, password_hash, display_name, is_active, must_change_password from users where username=$1', [username])
  if (userRes.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' })
  const user = userRes.rows[0]
  if (!user.is_active) return res.status(403).json({ error: 'User disabled' })
  const ok = await verifyPassword(password, user.password_hash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const perms = await query(
    `select p.code from permissions p
     join user_permissions up on up.permission_id = p.id
     where up.user_id=$1`,
    [user.id]
  )
  const token = signToken({ id: user.id, username: user.username, perms: perms.rows.map(r => r.code), must_change_password: !!user.must_change_password })
  res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name }, perms: perms.rows.map(r => r.code), must_change_password: !!user.must_change_password })
})

router.get('/auth/me', authMiddleware(true), async (req, res) => {
  res.json({ user: req.user })
})

// Change password (self)
router.post('/auth/change-password', authMiddleware(true), async (req, res) => {
  const { old_password, new_password } = req.body || {}
  if (!old_password || !new_password) return res.status(400).json({ error: 'Missing fields' })
  const meId = req.user.id
  const rs = await query('select id, username, password_hash from users where id=$1', [meId])
  if (rs.rowCount === 0) return res.status(404).json({ error: 'User not found' })
  const user = rs.rows[0]
  const ok = await verifyPassword(old_password, user.password_hash)
  if (!ok) return res.status(400).json({ error: '旧密码不正确' })
  const strength = validatePasswordStrength(new_password)
  if (!strength.ok) return res.status(400).json({ error: '密码强度不足', reasons: strength.reasons })
  const hash = await hashPassword(new_password)
  await query('update users set password_hash=$1, must_change_password=false, password_updated_at=now() where id=$2', [hash, meId])
  res.json({ ok: true })
})

// Users CRUD
router.get('/users', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const rs = await query('select id, username, display_name, is_active, created_at from users order by id')
  res.json(rs.rows)
})

router.post('/users', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const { username, password, display_name, is_active = true } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' })
  const hash = await hashPassword(password)
  try {
    const rs = await query(
      'insert into users(username, password_hash, display_name, is_active, must_change_password) values($1,$2,$3,$4,$5) returning id, username, display_name, is_active',
      [username, hash, display_name || username, is_active, true]
    )
    res.json(rs.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username exists' })
    throw e
  }
})

router.put('/users/:id', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const { display_name, is_active } = req.body || {}
  const id = Number(req.params.id)
  const rs = await query(
    'update users set display_name=coalesce($1, display_name), is_active=coalesce($2, is_active) where id=$3 returning id, username, display_name, is_active',
    [display_name, is_active, id]
  )
  if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json(rs.rows[0])
})

router.delete('/users/:id', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const id = Number(req.params.id)
  await query('delete from user_permissions where user_id=$1', [id])
  const rs = await query('delete from users where id=$1', [id])
  if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

// Admin reset user password (no complexity check), force change on next login
router.post('/users/:id/reset-password', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const id = Number(req.params.id)
  const { password } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Missing password' })
  const hash = await hashPassword(password)
  const rs = await query('update users set password_hash=$1, must_change_password=true, password_updated_at=null where id=$2 returning id', [hash, id])
  if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

// Permissions
router.get('/permissions', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const rs = await query('select id, code, name from permissions order by id')
  res.json(rs.rows)
})

router.get('/users/:id/permissions', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const id = Number(req.params.id)
  const rs = await query(
    `select p.code from permissions p
     join user_permissions up on up.permission_id=p.id
     where up.user_id=$1`,
    [id]
  )
  res.json(rs.rows.map(r => r.code))
})

router.put('/users/:id/permissions', authMiddleware(true), requirePerm('manage_users'), async (req, res) => {
  const id = Number(req.params.id)
  const { perms } = req.body || {}
  if (!Array.isArray(perms)) return res.status(400).json({ error: 'Invalid perms' })
  // Replace permissions
  await query('delete from user_permissions where user_id=$1', [id])
  if (perms.length) {
    const getIds = await query('select id, code from permissions where code = any($1::text[])', [perms])
    const values = getIds.rows.map(r => `(${id}, ${r.id})`).join(',')
    if (values) {
      await query(`insert into user_permissions(user_id, permission_id) values ${values} on conflict do nothing`)
    }
  }
  res.json({ ok: true })
})

// Customers
router.get('/customers', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const { q = '', page = 1, pageSize = 20, sort = 'id', order = 'desc' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const term = `%${q}%`
  const total = await query("select count(*) from customers where name ilike $1 or coalesce(abbr,'') ilike $1", [term])
  const rows = await query(`select * from customers where name ilike $1 or coalesce(abbr,'') ilike $1 order by ${sort} ${order === 'asc' ? 'asc' : 'desc'} offset $2 limit $3`, [term, offset, Number(pageSize)])
  res.json({ total: Number(total.rows[0].count), items: rows.rows })
})

router.post('/customers', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const { abbr, name, tax_rate = 0, opening_myr = 0, opening_cny = 0 } = req.body || {}
  if (!name) return res.status(400).json({ error: '客户名必填' })
  // Detect submitter from token (display_name preferred)
  let submitter = null
  try {
    const me = await query('select display_name, username from users where id=$1', [req.user.id])
    if (me.rowCount) submitter = me.rows[0].display_name || me.rows[0].username
  } catch {}
  const nr = await query('insert into customers(abbr, name, tax_rate, opening_myr, opening_cny, submitter) values($1,$2,$3,$4,$5,$6) returning *', [abbr || null, name, Number(tax_rate)||0, Number(opening_myr)||0, Number(opening_cny)||0, submitter || null])
  res.json(nr.rows[0])
})

router.delete('/customers', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const { ids } = req.body || {}
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'empty ids' })
  await query('delete from customers where id = any($1::int[])', [ids])
  res.json({ ok: true })
})

router.post('/customers/import', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Service Unavailable', detail: 'DATABASE_URL not configured' })
  }
  const { rows } = req.body || {}
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'invalid rows' })
  if (!rows.length) return res.json({ inserted: 0, errors: [] })
  // submitter from token
  let submitter = null
  try {
    const me = await query('select display_name, username from users where id=$1', [req.user.id])
    if (me.rowCount) submitter = me.rows[0].display_name || me.rows[0].username
  } catch {}

  // Validate & normalize
  const valids = []
  const errors = []
  const parseNum = (v) => {
    if (v === null || v === undefined || v === '') return 0
    const s = String(v).replace(/,/g, '').trim()
    const n = Number(s)
    return isNaN(n) ? 0 : n
  }
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {}
    const obj = {
      abbr: (r.abbr ?? '').toString().trim() || null,
      name: ((r.name ?? '') + '').trim(),
      tax_rate: parseNum(r.tax_rate ?? 0),
      opening_myr: parseNum(r.opening_myr ?? 0),
      opening_cny: parseNum(r.opening_cny ?? 0),
      submitter // 强制使用当前用户
    }
    if (!obj.name) {
      errors.push({ index: i, reason: '缺少客户名' })
      continue
    }
    if (isNaN(obj.tax_rate) || obj.tax_rate < 0 || obj.tax_rate > 100) {
      errors.push({ index: i, reason: '税率应在 0-100 之间' })
      continue
    }
    // 保护性处理
    obj.opening_myr = isNaN(obj.opening_myr) ? 0 : obj.opening_myr
    obj.opening_cny = isNaN(obj.opening_cny) ? 0 : obj.opening_cny
    valids.push(obj)
  }

  let inserted = 0
  const chunkSize = 200
  for (let i = 0; i < valids.length; i += chunkSize) {
    const chunk = valids.slice(i, i + chunkSize)
    if (!chunk.length) continue
  const values = chunk.map(r => [r.abbr, r.name, r.tax_rate, r.opening_myr, r.opening_cny, submitter])
    const params = values.map((_, idx) => `($${idx*6+1},$${idx*6+2},$${idx*6+3},$${idx*6+4},$${idx*6+5},$${idx*6+6})`).join(',')
    const flat = values.flat()
    const sql = `insert into customers(abbr,name,tax_rate,opening_myr,opening_cny,submitter) values ${params}`
    try {
      await query(sql, flat)
      inserted += chunk.length
    } catch (e) {
      // 如果表不存在（42P01），尝试自动初始化 schema 后重试一次当前批次
      if (e && (e.code === '42P01' || /relation\s+"?customers"?\s+does not exist/i.test(e.message))) {
        try {
          await ensureSchema()
          await query(sql, flat)
          inserted += chunk.length
          continue
        } catch (e2) {
          // 继续走降级逐行插入
        }
      }
      // 批次失败则降级逐行插入，尽最大可能导入
      for (let k = 0; k < chunk.length; k++) {
        const r = chunk[k]
        try {
          await query('insert into customers(abbr,name,tax_rate,opening_myr,opening_cny,submitter) values($1,$2,$3,$4,$5,$6)', [r.abbr, r.name, r.tax_rate, r.opening_myr, r.opening_cny, submitter])
          inserted += 1
        } catch (e1) {
          errors.push({ index: i + k, reason: '行插入失败', detail: e1?.message })
        }
      }
    }
  }

  res.json({ inserted, errors })
})

// Import customers via raw CSV content
router.post('/customers/import-csv', express.text({ type: '*/*', limit: '10mb' }), authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: 'Service Unavailable', detail: 'DATABASE_URL not configured' })
  }
  try {
    if (!req.body || typeof req.body !== 'string') return res.status(400).json({ error: 'empty body' })
    const text = req.body.replace(/^\ufeff/, '') // strip BOM if any
    // submitter from token
    let submitter = null
    try {
      const me = await query('select display_name, username from users where id=$1', [req.user.id])
      if (me.rowCount) submitter = me.rows[0].display_name || me.rows[0].username
    } catch {}
    let records = []
    let usedColumns = false
    try {
      // First try with header
      records = parseCsv(text, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
      usedColumns = true
    } catch {
      // Fallback without header
      records = parseCsv(text, {
        bom: true,
        columns: false,
        skip_empty_lines: true,
        trim: true
      })
      usedColumns = false
    }

    // Normalize rows
    const normalized = []
    const errors = []
    if (usedColumns) {
      let lineNo = 2 // header is line 1
      for (const r of records) {
        const obj = {
          abbr: (r.abbr ?? r.ABBR ?? r.Abbr ?? '').toString().trim(),
          name: (r.name ?? r.NAME ?? r.Name ?? '').toString().trim(),
          tax_rate: Number(r.tax_rate ?? r.TAX_RATE ?? r.Tax_rate ?? 0),
          opening_myr: Number(r.opening_myr ?? r.MYR ?? r.opening_MYR ?? 0),
          opening_cny: Number(r.opening_cny ?? r.CNY ?? r.opening_CNY ?? 0),
          submitter
        }
        if (!obj.name) {
          errors.push({ line: lineNo, reason: '缺少客户名' })
        } else {
          if (isNaN(obj.tax_rate) || obj.tax_rate < 0 || obj.tax_rate > 100) {
            errors.push({ line: lineNo, reason: '税率应在 0-100 之间' })
          } else {
            normalized.push(obj)
          }
        }
        lineNo++
      }
    } else {
      // No header: expect 6 columns
      let lineNo = 1
      for (const r of records) {
  const [abbr = '', name = '', tax_rate = 0, opening_myr = 0, opening_cny = 0] = r
  const obj = { abbr, name, tax_rate: Number(tax_rate), opening_myr: Number(opening_myr), opening_cny: Number(opening_cny), submitter }
        if (!obj.name) {
          errors.push({ line: lineNo, reason: '缺少客户名' })
        } else if (isNaN(obj.tax_rate) || obj.tax_rate < 0 || obj.tax_rate > 100) {
          errors.push({ line: lineNo, reason: '税率应在 0-100 之间' })
        } else {
          normalized.push(obj)
        }
        lineNo++
      }
    }

    if (!normalized.length) return res.json({ inserted: 0, errors })

    // Insert
  const values = normalized.map(r => [r.abbr || null, r.name, Number(r.tax_rate) || 0, Number(r.opening_myr) || 0, Number(r.opening_cny) || 0, submitter || null])
    const params = values.map((_, i) => `($${i*6+1},$${i*6+2},$${i*6+3},$${i*6+4},$${i*6+5},$${i*6+6})`).join(',')
    const flat = values.flat()
    const sql = `insert into customers(abbr,name,tax_rate,opening_myr,opening_cny,submitter) values ${params}`
    await query(sql, flat)
    return res.json({ inserted: values.length, errors })
  } catch (e) {
    console.error('import-csv failed', e)
    return res.status(400).json({ error: '解析或导入失败' })
  }
})

router.get('/customers/export', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const rs = await query('select abbr,name,tax_rate,opening_myr,opening_cny,submitter from customers order by id desc')
  const lines = rs.rows.map(r => [r.abbr||'', r.name||'', r.tax_rate||0, r.opening_myr||0, r.opening_cny||0, r.submitter||''].join(','))
  const csv = lines.join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"')
  const BOM = '\ufeff'
  res.send(BOM + csv)
})

// Currencies CRUD (simple)
router.get('/currencies', authMiddleware(true), requirePerm('view_settings'), async (req, res) => {
  const rs = await query('select code, name from currencies order by code')
  res.json(rs.rows)
})
router.post('/currencies', authMiddleware(true), requirePerm('view_settings'), async (req, res) => {
  const { code, name } = req.body || {}
  if (!code || !name) return res.status(400).json({ error: 'Missing fields' })
  await query('insert into currencies(code, name) values($1,$2) on conflict do nothing', [code.toUpperCase(), name])
  res.json({ ok: true })
})
router.delete('/currencies/:code', authMiddleware(true), requirePerm('view_settings'), async (req, res) => {
  const code = (req.params.code || '').toUpperCase()
  await query('delete from currencies where code=$1', [code])
  res.json({ ok: true })
})

// Receiving accounts
router.get('/accounts', authMiddleware(true), requirePerm('view_accounts'), async (req, res) => {
  const { page = 1, pageSize = 20, sort = 'id', order = 'desc' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const sortMap = {
    id: 'a.id',
    account_name: 'a.account_name',
    bank_account: 'a.bank_account',
    currency_code: 'a.currency_code',
    opening_balance: 'a.opening_balance',
    bank_zh: 'b.zh',
    bank_code: 'b.code'
  }
  const sortCol = sortMap[String(sort)] || sortMap.id
  const ord = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc'
  const totalRs = await query('select count(*) from receiving_accounts')
  const rs = await query(
    `select a.id, a.account_name, a.bank_account, a.currency_code, a.opening_balance,
            b.id as bank_id, b.code as bank_code, b.zh as bank_zh, b.en as bank_en, b.logo_url as bank_logo
       from receiving_accounts a
       left join banks b on b.id = a.bank_id
      order by ${sortCol} ${ord}
      offset $1 limit $2`,
    [offset, Number(pageSize)]
  )
  res.json({ total: Number(totalRs.rows[0].count), items: rs.rows })
})
router.post('/accounts', authMiddleware(true), requirePerm('view_accounts'), async (req, res) => {
  const { account_name, bank_id, bank_account, currency_code, opening_balance = 0 } = req.body || {}
  if (!account_name || !bank_id || !bank_account || !currency_code) return res.status(400).json({ error: 'Missing fields' })
  const rs = await query('insert into receiving_accounts(account_name, bank_id, bank_account, currency_code, opening_balance) values($1,$2,$3,$4,$5) returning *', [account_name, Number(bank_id), bank_account, currency_code.toUpperCase(), Number(opening_balance)||0])
  res.json(rs.rows[0])
})
router.put('/accounts/:id', authMiddleware(true), requirePerm('view_accounts'), async (req, res) => {
  const id = Number(req.params.id)
  const { account_name, bank_id, bank_account, currency_code, opening_balance } = req.body || {}
  const fields = []
  const values = []
  let idx = 1
  if (account_name !== undefined) { fields.push(`account_name=$${idx++}`); values.push(account_name) }
  if (bank_id !== undefined) { fields.push(`bank_id=$${idx++}`); values.push(Number(bank_id)) }
  if (bank_account !== undefined) { fields.push(`bank_account=$${idx++}`); values.push(bank_account) }
  if (currency_code !== undefined) { fields.push(`currency_code=$${idx++}`); values.push(String(currency_code).toUpperCase()) }
  if (opening_balance !== undefined) { fields.push(`opening_balance=$${idx++}`); values.push(Number(opening_balance)||0) }
  if (!fields.length) return res.status(400).json({ error: 'no changes' })
  values.push(id)
  const rs = await query(`update receiving_accounts set ${fields.join(', ')} where id=$${idx} returning *`, values)
  if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json(rs.rows[0])
})
router.delete('/accounts/:id', authMiddleware(true), requirePerm('view_accounts'), async (req, res) => {
  const id = Number(req.params.id)
  const rs = await query('delete from receiving_accounts where id=$1', [id])
  if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

// Customer specific receiving accounts
router.get('/customers/:id/accounts', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const cid = Number(req.params.id)
  const rs = await query(`
    select a.id, a.account_name, a.bank_account, a.currency_code,
           b.id as bank_id, b.code as bank_code, b.zh as bank_zh, b.en as bank_en, b.logo_url as bank_logo
    from customer_receiving_accounts a
    left join banks b on b.id = a.bank_id
    where a.customer_id = $1
    order by a.id desc
  `, [cid])
  res.json(rs.rows)
})

router.post('/customers/:id/accounts', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const cid = Number(req.params.id)
  const { account_name, bank_id, bank_account, currency_code } = req.body || {}
  if (!account_name || !bank_id || !bank_account || !currency_code) return res.status(400).json({ error: 'Missing fields' })
  try {
    const rs = await query(
      'insert into customer_receiving_accounts(customer_id, account_name, bank_id, bank_account, currency_code) values($1,$2,$3,$4,$5) returning *',
      [cid, account_name, Number(bank_id), bank_account, String(currency_code).toUpperCase()]
    )
    res.json(rs.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '该客户下该银行账户已存在' })
    throw e
  }
})

router.delete('/customers/:id/accounts/:aid', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const cid = Number(req.params.id)
  const aid = Number(req.params.aid)
  const rs = await query('delete from customer_receiving_accounts where id=$1 and customer_id=$2', [aid, cid])
  if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

router.put('/customers/:id/accounts/:aid', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const cid = Number(req.params.id)
  const aid = Number(req.params.aid)
  const { account_name, bank_id, bank_account, currency_code } = req.body || {}
  const fields = []
  const values = []
  let idx = 1
  if (account_name !== undefined) { fields.push(`account_name=$${idx++}`); values.push(account_name) }
  if (bank_id !== undefined) { fields.push(`bank_id=$${idx++}`); values.push(Number(bank_id)) }
  if (bank_account !== undefined) { fields.push(`bank_account=$${idx++}`); values.push(bank_account) }
  if (currency_code !== undefined) { fields.push(`currency_code=$${idx++}`); values.push(String(currency_code).toUpperCase()) }
  if (!fields.length) return res.status(400).json({ error: 'no changes' })
  values.push(aid); values.push(cid)
  try {
    const rs = await query(`update customer_receiving_accounts set ${fields.join(', ')} where id=$${idx++} and customer_id=$${idx} returning *`, values)
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rs.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '该客户下该银行账户已存在' })
    throw e
  }
})

// Banks CRUD (server-managed)
router.get('/banks', authMiddleware(true), requirePerm('view_banks'), async (req, res) => {
  const rs = await query('select id, code, zh, en, logo_url from banks order by id')
  res.json(rs.rows)
})

// Accept either {code, zh, en, logo_url} or {logo_data_url} (data:image/svg+xml;base64,...)
router.post('/banks', authMiddleware(true), requirePerm('view_banks'), express.json({ limit: '10mb' }), async (req, res) => {
  let { code, zh, en, logo_url, logo_data_url } = req.body || {}
  if (!code || !zh || !en) return res.status(400).json({ error: 'Missing fields' })
  // Normalize to uppercase for consistency (as requested)
  code = String(code).toUpperCase()
  zh = String(zh).toUpperCase()
  en = String(en).toUpperCase()
  // Handle data URL upload
  if (logo_data_url && /^data:/i.test(logo_data_url)) {
    try {
      const m = /^data:(.+);base64,(.*)$/i.exec(logo_data_url)
      if (!m) return res.status(400).json({ error: 'invalid data url' })
      const mime = m[1]
      const buf = Buffer.from(m[2], 'base64')
      const ext = mime.includes('svg') ? 'svg' : (mime.includes('png') ? 'png' : 'bin')
      const uploads = path.join(__dirname, '../../uploads')
      if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true })
      const file = path.join(uploads, `bank_${code}.${ext}`)
      fs.writeFileSync(file, buf)
      logo_url = `/uploads/${path.basename(file)}`
    } catch (e) {
      return res.status(400).json({ error: 'upload failed' })
    }
  }
  try {
    const rs = await query('insert into banks(code, zh, en, logo_url) values($1,$2,$3,$4) returning id, code, zh, en, logo_url', [code, zh, en, logo_url || null])
    res.json(rs.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'code exists' })
    throw e
  }
})

router.delete('/banks/:id', authMiddleware(true), requirePerm('view_banks'), async (req, res) => {
  const id = Number(req.params.id)
  const rs = await query('delete from banks where id=$1 returning id', [id])
  if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

router.put('/banks/:id', authMiddleware(true), requirePerm('view_banks'), express.json({ limit: '10mb' }), async (req, res) => {
  const id = Number(req.params.id)
  let { code, zh, en, logo_url, logo_data_url } = req.body || {}
  // Optional upload
  if (logo_data_url && /^data:/i.test(logo_data_url)) {
    try {
      const m = /^data:(.+);base64,(.*)$/i.exec(logo_data_url)
      if (!m) return res.status(400).json({ error: 'invalid data url' })
      const mime = m[1]
      const buf = Buffer.from(m[2], 'base64')
      const ext = mime.includes('svg') ? 'svg' : (mime.includes('png') ? 'png' : 'bin')
      const uploads = path.join(__dirname, '../../uploads')
      if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true })
      const file = path.join(uploads, `bank_${code || 'id'+id}.${ext}`)
      fs.writeFileSync(file, buf)
      logo_url = `/uploads/${path.basename(file)}`
    } catch (e) {
      return res.status(400).json({ error: 'upload failed' })
    }
  }
  // Build dynamic update
  const fields = []
  const values = []
  let idx = 1
  // Normalize to uppercase for provided string fields
  if (code) { code = String(code).toUpperCase(); fields.push(`code=$${idx++}`); values.push(code) }
  if (zh) { zh = String(zh).toUpperCase(); fields.push(`zh=$${idx++}`); values.push(zh) }
  if (en) { en = String(en).toUpperCase(); fields.push(`en=$${idx++}`); values.push(en) }
  if (logo_url) { fields.push(`logo_url=$${idx++}`); values.push(logo_url) }
  if (!fields.length) return res.status(400).json({ error: 'no changes' })
  values.push(id)
  try {
    const rs = await query(`update banks set ${fields.join(', ')} where id=$${idx} returning id, code, zh, en, logo_url`, values)
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rs.rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'code exists' })
    throw e
  }
})

// Reset to a default set
router.post('/banks/reset-defaults', authMiddleware(true), requirePerm('view_banks'), async (req, res) => {
  const defaults = [
    ['ICBC','中国工商银行','Industrial and Commercial Bank of China','/banks/icbc.svg'],
    ['ABC','中国农业银行','Agricultural Bank of China','/banks/abc.svg'],
    ['BOC','中国银行','Bank of China','/banks/boc.svg'],
    ['CCB','中国建设银行','China Construction Bank','/banks/ccb.svg'],
    ['BCM','交通银行','Bank of Communications','/banks/bcm.svg'],
    ['MAYBANK','马银行','Maybank','/banks/maybank.svg'],
    ['CIMB','联昌银行','CIMB Bank','/banks/cimb.svg'],
    ['PUBLIC','大众银行','Public Bank','/banks/public.svg'],
    ['RHB','兴业银行（马）','RHB Bank','/banks/rhb.svg'],
    ['HONGLEONG','丰隆银行','Hong Leong Bank','/banks/hlb.svg']
  ]
  await query('truncate table banks restart identity')
  const params = defaults.map((_, i) => `($${i*4+1},$${i*4+2},$${i*4+3},$${i*4+4})`).join(',')
  await query(`insert into banks(code, zh, en, logo_url) values ${params}`, defaults.flat())
  res.json({ ok: true, count: defaults.length })
})

router.get('/customers/template', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const header = 'abbr,name,tax_rate,opening_myr,opening_cny,submitter' // 简称,客户名,税率,马币期初,人民币期初,提交人
  const sample = ['ABC,深圳市某某公司,6,1000,2000,王五', 'DEF,广州某某集团,0,0,3500,李四'].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="customers_template.csv"')
  const BOM = '\ufeff'
  res.send(BOM + [header, sample].join('\n'))
})

// 注册交易管理API路由
// 说明：
// - 生产环境（或显式未开启开关）默认使用真实数据库路由
// - 当开发环境缺少数据库配置时，可通过环境变量 ALLOW_TRANSACTIONS_MOCK=1 启用模拟数据
// - 若 DATABASE_URL 未配置且未显式禁用（生产下请勿开启），则回退到模拟数据，避免前端页面不可用
const mockCtrl = createTransactionsController()
router.use('/transactions', (req, res, next) => {
  const allowMock = process.env.ALLOW_TRANSACTIONS_MOCK === '1'
  const hasDb = !!process.env.DATABASE_URL
  // 在没有数据库的情况下，且允许 mock 时，使用模拟
  if (!hasDb && allowMock) {
    return mockCtrl(req, res, next)
  }
  return transactionsRouter(req, res, next)
})



