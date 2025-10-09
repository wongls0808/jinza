import express from 'express'
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
