import express from 'express'
import { parse as parseCsv } from 'csv-parse/sync'
import { authMiddleware, signToken, verifyPassword, hashPassword, validatePasswordStrength, requirePerm, ensureSchema } from './auth.js'
import { query } from './db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

export const router = express.Router()

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

// ===== Receipts (Bank Statements) =====
// Import CSV (raw text) and persist statement + transactions
router.post('/receipts/import', express.text({ type: '*/*', limit: '20mb' }), authMiddleware(true), requirePerm('view_receipts'), async (req, res) => {
  const num = (v) => v == null || v === '' ? null : Number(String(v).replace(/[^0-9.\-]/g, ''))
  const parseAmount = (v) => {
    if (v == null) return null
    let s = String(v).trim()
    if (!s) return null
    s = s.replace(/^=\"?/, '').replace(/\"?$/, '')
    let sign = 1
    if (/\bDR\b$/i.test(s)) { sign = -1; s = s.replace(/\bDR\b/i, '').trim() }
    if (/\bCR\b$/i.test(s)) { sign = 1; s = s.replace(/\bCR\b/i, '').trim() }
    const parenNeg = /^\((.*)\)$/.exec(s)
    if (parenNeg) { sign = -1; s = parenNeg[1] }
    s = s.replace(/[^0-9.\-]/g, '')
    if (!s) return null
    const n = Number(s)
    if (isNaN(n)) return null
    return sign * n
  }
  const isNum = (v) => parseAmount(v) != null
  const cleanCheque = (s) => {
    if (s == null) return null
    let x = String(s).trim()
    // Remove patterns like ="123456" or leading/trailing quotes
    x = x.replace(/^=\"?/, '').replace(/\"?$/, '')
    x = x.replace(/^="?/, '').replace(/"?$/, '')
    x = x.replace(/^'+|'+$/g, '')
    return x || null
  }
  const parseDate = (s) => {
    if (!s) return null
    const str = String(s).trim()
    const [datePart] = str.split(/\s+/)
    const zh = /^\d{4}年\d{1,2}月\d{1,2}日$/.test(str)
    if (zh) {
      const m = str.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)
      if (m) return new Date(`${m[2]}/${m[3]}/${m[1]}`)
    }
    if (/^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}$/.test(datePart)) {
      const m = datePart.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/)
      if (m) return new Date(`${m[2]}/${m[1]}/${m[3].length === 2 ? ('20'+m[3]) : m[3]}`)
    }
    if (/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(datePart)) return new Date(datePart)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(datePart)) return new Date(datePart)
    return null
  }
  const extractRow = (rawRow) => {
    const row = (rawRow || []).map(c => (c == null ? '' : String(c).trim()))
    // Find a date cell within the first 6 columns
    let dateIdx = -1
    let dateObj = null
    const scanLimit = Math.min(row.length, 6)
    for (let i = 0; i < scanLimit; i++) {
      const d = row[i]
      const parsed = parseDate(d)
      if (parsed) { dateIdx = i; dateObj = parsed; break }
    }
    if (dateIdx < 0) return null
    const cheque = cleanCheque(row[dateIdx + 1])
    // Find amount columns near the end (up to 2 numeric values) after dateIdx
    let debit = null, credit = null
    const numsIdx = []
    for (let i = row.length - 1; i > dateIdx + 1; i--) { if (isNum(row[i])) numsIdx.push(i); if (numsIdx.length >= 2) break }
    if (numsIdx.length === 0 && isNum(row[dateIdx + 2])) numsIdx.push(dateIdx + 2)
    if (numsIdx.length === 1) {
      // Only one numeric column: decide sign? keep in credit and debit null if positive
      const n = parseAmount(row[numsIdx[0]])
      if (n != null && !isNaN(n)) {
        // Heuristic: positive as credit, negative as debit
        if (n < 0) debit = Math.abs(n); else credit = n
      }
    } else if (numsIdx.length >= 2) {
      // Assign smaller index as debit (usually left), larger index as credit (right)
      const a = Math.min(numsIdx[0], numsIdx[1])
      const b = Math.max(numsIdx[0], numsIdx[1])
      debit = parseAmount(row[a])
      credit = parseAmount(row[b])
      // Guard invalid
      if (debit != null && credit != null && debit > 0 && credit > 0) {
        // keep both
      }
    }
    // Build description from columns between index 2 and first amount index (exclusive)
    const cut = numsIdx.length ? Math.min(...numsIdx) : row.length
    const descParts = []
    for (let i = dateIdx + 2; i < cut; i++) { const v = row[i]; if (v) descParts.push(v) }
    const description = descParts.join(' ').trim() || null
    return { trn_date: dateObj, cheque_ref: cheque, description, debit, credit, ref1: null, ref2: null, ref3: null, ref4: null, ref5: null, ref6: null }
  }
  const insertAll = async (kv, rows) => {
    const stmtIns = await query(
      `insert into bank_statements(
        account_number, account_name, account_type,
        period_from, period_to,
        available_balance, current_balance,
        generation_date, generation_time,
        interest_paid_ytd, interest_accrual,
        hold_amount, one_day_float, online_float, od_limit,
        raw_filename, uploaded_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      returning id`, [
        kv['Account Number'] || kv['Account No.'] || kv['ACCOUNT NUMBER'] || null,
        kv['Account Name'] || kv['ACCOUNT NAME'] || null,
        kv['Account Type'] || kv['ACCOUNT TYPE'] || null,
        parseDate(kv['From Date'] || kv['Period From']),
        parseDate(kv['To Date'] || kv['Period To']),
        num(kv['Available Balance']),
        num(kv['Current Balance']),
        parseDate(kv['Generation Date']),
        kv['Generation Time'] || null,
        num(kv['Interest Paid YTD']),
        num(kv['Interest Accrual']),
        num(kv['Hold Amount']),
        num(kv['One Day Float']),
        num(kv['Online Float']),
        num(kv['OD Limit']),
        (req.query.filename || ''), req.user.id
      ])
    const stmtId = stmtIns.rows[0].id
    let toInsert = rows
    // Suppress duplicates for same account across existing statements: (account_number, date, cheque_ref, debit, credit)
    const accNo = kv['Account Number'] || kv['Account No.'] || kv['ACCOUNT NUMBER'] || null
    if (accNo && rows.length) {
      const tuples = rows.map(r => [r.trn_date?.toISOString().slice(0,10), r.cheque_ref || '', r.debit || 0, r.credit || 0])
      const params = tuples.map((_, i) => `($${i*4+1},$${i*4+2},$${i*4+3},$${i*4+4})`).join(',')
      const flat = tuples.flat()
      const existed = await query(
        `select t.trn_date::date as d, coalesce(t.cheque_ref,'') as c, coalesce(t.debit,0) as db, coalesce(t.credit,0) as cr
           from bank_transactions t
           join bank_statements s on s.id = t.statement_id
          where s.account_number = $${flat.length+1}
            and (t.trn_date::date, coalesce(t.cheque_ref,''), coalesce(t.debit,0), coalesce(t.credit,0)) in (values ${params})`,
        [...flat, accNo]
      )
      const set = new Set(existed.rows.map(r => `${r.d}|${r.c}|${r.db}|${r.cr}`))
      toInsert = rows.filter(r => !set.has(`${r.trn_date?.toISOString().slice(0,10)}|${r.cheque_ref || ''}|${r.debit || 0}|${r.credit || 0}`))
    }
    if (toInsert.length) {
      const params = toInsert.map((_, idx) => `($${idx*12+1},$${idx*12+2},$${idx*12+3},$${idx*12+4},$${idx*12+5},$${idx*12+6},$${idx*12+7},$${idx*12+8},$${idx*12+9},$${idx*12+10},$${idx*12+11},$${idx*12+12})`).join(',')
      const flat = toInsert.flatMap(r => [stmtId, r.trn_date, r.cheque_ref, r.description, r.debit, r.credit, r.ref1, r.ref2, r.ref3, r.ref4, r.ref5, r.ref6])
      await query(`insert into bank_transactions(statement_id,trn_date,cheque_ref,description,debit,credit,ref1,ref2,ref3,ref4,ref5,ref6) values ${params}`, flat)
      return { stmtId, count: toInsert.length, skipped: rows.length - toInsert.length }
    }
    return { stmtId, count: 0, skipped: rows.length }
  }

  try {
    let text = req.body || ''
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'empty body' })
    text = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n')

    // First pass: try CSV mode
    let kv = {}
    let txnRows = []
    try {
      let csvRows = parseCsv(text, { bom: true, relax_column_count: true, skip_empty_lines: true, trim: true })
      const mostlySingle = csvRows.length > 3 && csvRows.filter(r => r.length <= 1).length / csvRows.length > 0.6
      if (mostlySingle && /;/.test(text)) {
        csvRows = parseCsv(text, { bom: true, relax_column_count: true, skip_empty_lines: true, trim: true, delimiter: ';' })
      }
      // collect kv before header
      let headerIdx = -1
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i].map(c => String(c).trim())
        const first = row[0] || ''
        if (/^Trn\.?\s*Date/i.test(first) || /^Transaction\s*Date/i.test(first)) { headerIdx = i; break }
        if (row.length >= 2 && first) {
          const key = first.replace(/:$/, '')
          kv[key] = row[1]
        }
      }
      if (headerIdx >= 0) {
        for (let i = headerIdx + 1; i < csvRows.length; i++) {
          const row = csvRows[i]
          const obj = extractRow(row)
          if (obj) txnRows.push(obj)
        }
      } else {
        // No explicit header like "Trn Date"; attempt to parse every row
        for (let i = 0; i < csvRows.length; i++) {
          const row = csvRows[i]
          const obj = extractRow(row)
          if (obj) txnRows.push(obj)
        }
      }
    } catch {}

    // Fallback: whitespace/TSV mode
    if (!txnRows.length) {
      const lines = text.split(/\n/).map(s => s.trim())
      let i = 0
      for (; i < lines.length; i++) {
        const line = lines[i]
        if (!line) continue
        if (/^Trn\.?\s*Date/i.test(line) || /^Transaction Type/i.test(line)) break
        const m = /^(.*?)[\t,:]\s*(.*)$/.exec(line) // support key: value and key, value
        if (m) kv[m[1].trim()] = m[2].trim()
      }
      for (; i < lines.length; i++) { if (/^Trn\.?\s*Date/i.test(lines[i])) { i++; break } }
      for (; i < lines.length; i++) {
        const l = lines[i]
        if (!l) continue
        let cols = l.split('\t')
        if (cols.length === 1) cols = l.split(/\s{2,}/)
        const obj = extractRow(cols)
        if (obj) txnRows.push(obj)
      }
    }

    // Insert with one-time ensureSchema retry on relation-missing
    try {
      const { stmtId, count, skipped = 0 } = await insertAll(kv, txnRows)
      return res.json({ ok: true, statement_id: stmtId, inserted: count, skipped })
    } catch (e) {
      if (e && (e.code === '42P01' || /relation\s+\"?bank_statements\"?\s+does not exist/i.test(e.message))) {
        try {
          await ensureSchema()
          const { stmtId, count, skipped = 0 } = await insertAll(kv, txnRows)
          return res.json({ ok: true, statement_id: stmtId, inserted: count, skipped })
        } catch (e2) {
          console.error('receipts import retry failed', e2)
          return res.status(400).json({ error: 'import failed' })
        }
      }
      console.error('receipts import failed', e)
      return res.status(400).json({ error: 'import failed' })
    }
  } catch (e) {
    console.error('receipts import failed (outer)', e)
    res.status(400).json({ error: 'import failed' })
  }
})

// List all transactions across statements, with account info and matched receiving account
router.get('/receipts/transactions', authMiddleware(true), requirePerm('view_receipts'), async (req, res) => {
  const { page = 1, pageSize = 20, sort = 'trn_date', order = 'asc', q = '' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const sortMap = { trn_date: 't.trn_date', debit: 't.debit', credit: 't.credit', account_number: 's.account_number' }
  const sortCol = sortMap[String(sort)] || 't.trn_date'
  const ord = String(order).toLowerCase() === 'desc' ? 'desc' : 'asc'
  const term = `%${q}%`
  const total = await query(`
    select count(*)
      from bank_transactions t
      join bank_statements s on s.id = t.statement_id
     where (coalesce(t.description,'') ilike $1 or coalesce(t.cheque_ref,'') ilike $1 or coalesce(s.account_number,'') ilike $1 or coalesce(s.account_name,'') ilike $1)
  `, [term])
  const rs = await query(`
    select t.*, s.account_number, s.account_name,
           ra.id as matched_account_id, ra.account_name as matched_account_name
      from bank_transactions t
      join bank_statements s on s.id = t.statement_id
      left join receiving_accounts ra on ra.bank_account = s.account_number
     where (coalesce(t.description,'') ilike $4 or coalesce(t.cheque_ref,'') ilike $4 or coalesce(s.account_number,'') ilike $4 or coalesce(s.account_name,'') ilike $4)
     order by ${sortCol} ${ord}
     offset $1 limit $2
  `, [offset, Number(pageSize), sortCol, term])
  res.json({ total: Number(total.rows[0].count), items: rs.rows })
})

router.get('/receipts/statements', authMiddleware(true), requirePerm('view_receipts'), async (req, res) => {
  const { page = 1, pageSize = 20, sort = 'id', order = 'desc' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const sortMap = { id: 'id', generation_date: 'generation_date', account_number: 'account_number', period_from: 'period_from', period_to: 'period_to' }
  const sortCol = sortMap[String(sort)] || 'id'
  const ord = String(order).toLowerCase() === 'asc' ? 'asc' : 'desc'
  const total = await query('select count(*) from bank_statements')
  const rs = await query(`select * from bank_statements order by ${sortCol} ${ord} offset $1 limit $2`, [offset, Number(pageSize)])
  res.json({ total: Number(total.rows[0].count), items: rs.rows })
})

router.get('/receipts/:id/transactions', authMiddleware(true), requirePerm('view_receipts'), async (req, res) => {
  const id = Number(req.params.id)
  const { page = 1, pageSize = 20, sort = 'trn_date', order = 'asc', q = '' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const sortMap = { trn_date: 'trn_date', debit: 'debit', credit: 'credit' }
  const sortCol = sortMap[String(sort)] || 'trn_date'
  const ord = String(order).toLowerCase() === 'desc' ? 'desc' : 'asc'
  const term = `%${q}%`
  const total = await query('select count(*) from bank_transactions where statement_id=$1 and (coalesce(description,\'\') ilike $2 or coalesce(cheque_ref,\'\') ilike $2)', [id, term])
  const rs = await query(`select * from bank_transactions where statement_id=$1 and (coalesce(description,'') ilike $4 or coalesce(cheque_ref,'') ilike $4) order by ${sortCol} ${ord} offset $2 limit $3`, [id, offset, Number(pageSize), term])
  res.json({ total: Number(total.rows[0].count), items: rs.rows })
})
