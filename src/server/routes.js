import express from 'express'
import { parse as parseCsv } from 'csv-parse/sync'
import { authMiddleware, signToken, verifyPassword, hashPassword, validatePasswordStrength, requirePerm } from './auth.js'
import { query } from './db.js'

export const router = express.Router()

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
  const total = await query('select count(*) from customers where name ilike $1 or coalesce(abbr,"") ilike $1', [term])
  const rows = await query(`select * from customers where name ilike $1 or coalesce(abbr,"") ilike $1 order by ${sort} ${order === 'asc' ? 'asc' : 'desc'} offset $2 limit $3`, [term, offset, Number(pageSize)])
  res.json({ total: Number(total.rows[0].count), items: rows.rows })
})

router.post('/customers', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const { abbr, name, tax_rate = 0, opening_myr = 0, opening_cny = 0, submitter } = req.body || {}
  if (!name) return res.status(400).json({ error: '客户名必填' })
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
  const { rows } = req.body || {}
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'invalid rows' })
  if (!rows.length) return res.json({ inserted: 0, errors: [] })

  // Validate & normalize
  const valids = []
  const errors = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || {}
    const obj = {
      abbr: (r.abbr ?? '').toString().trim() || null,
      name: ((r.name ?? '') + '').trim(),
      tax_rate: Number(r.tax_rate ?? 0),
      opening_myr: Number(r.opening_myr ?? 0),
      opening_cny: Number(r.opening_cny ?? 0),
      submitter: (r.submitter ?? '').toString().trim() || null
    }
    if (!obj.name) {
      errors.push({ index: i, reason: '缺少客户名' })
      continue
    }
    if (isNaN(obj.tax_rate) || obj.tax_rate < 0 || obj.tax_rate > 100) {
      errors.push({ index: i, reason: '税率应在 0-100 之间' })
      continue
    }
    // Number() 可能为 NaN
    obj.opening_myr = isNaN(obj.opening_myr) ? 0 : obj.opening_myr
    obj.opening_cny = isNaN(obj.opening_cny) ? 0 : obj.opening_cny
    valids.push(obj)
  }

  let inserted = 0
  const chunkSize = 500
  for (let i = 0; i < valids.length; i += chunkSize) {
    const chunk = valids.slice(i, i + chunkSize)
    if (!chunk.length) continue
    const values = chunk.map(r => [r.abbr, r.name, r.tax_rate, r.opening_myr, r.opening_cny, r.submitter])
    const params = values.map((_, idx) => `($${idx*6+1},$${idx*6+2},$${idx*6+3},$${idx*6+4},$${idx*6+5},$${idx*6+6})`).join(',')
    const flat = values.flat()
    const sql = `insert into customers(abbr,name,tax_rate,opening_myr,opening_cny,submitter) values ${params}`
    try {
      await query(sql, flat)
      inserted += chunk.length
    } catch (e) {
      // 捕获批次插入错误，尽量返回已插入数量
      errors.push({ index: i, reason: '批次插入失败', detail: e.message })
    }
  }

  res.json({ inserted, errors })
})

// Import customers via raw CSV content
router.post('/customers/import-csv', express.text({ type: '*/*', limit: '10mb' }), authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'string') return res.status(400).json({ error: 'empty body' })
    const text = req.body.replace(/^\ufeff/, '') // strip BOM if any
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
          submitter: (r.submitter ?? r.SUBMITTER ?? r.Submitter ?? '').toString().trim()
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
        const [abbr = '', name = '', tax_rate = 0, opening_myr = 0, opening_cny = 0, submitter = ''] = r
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
    const values = normalized.map(r => [r.abbr || null, r.name, Number(r.tax_rate) || 0, Number(r.opening_myr) || 0, Number(r.opening_cny) || 0, r.submitter || null])
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

router.get('/customers/template', authMiddleware(true), requirePerm('view_customers'), async (req, res) => {
  const header = 'abbr,name,tax_rate,opening_myr,opening_cny,submitter' // 简称,客户名,税率,马币期初,人民币期初,提交人
  const sample = ['ABC,深圳市某某公司,6,1000,2000,王五', 'DEF,广州某某集团,0,0,3500,李四'].join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="customers_template.csv"')
  const BOM = '\ufeff'
  res.send(BOM + [header, sample].join('\n'))
})
