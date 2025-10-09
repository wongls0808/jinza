import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function authMiddleware(required = true) {
  return async (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth) {
      if (required) return res.status(401).json({ error: 'Unauthorized' })
      req.user = null
      return next()
    }
    const token = auth.replace('Bearer ', '')
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
      return next()
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plain, salt)
}

export async function ensureSchema() {
  // Create tables if not exists
  await query(`
    create table if not exists users (
      id serial primary key,
      username text unique not null,
      password_hash text not null,
      display_name text,
      is_active boolean default true,
      created_at timestamptz default now()
    );

    create table if not exists permissions (
      id serial primary key,
      code text unique not null,
      name text not null
    );

    create table if not exists user_permissions (
      user_id int references users(id) on delete cascade,
      permission_id int references permissions(id) on delete cascade,
      primary key(user_id, permission_id)
    );
  `)
}

export async function seedInitialAdmin() {
  // Seed default admin user and core permissions if absent
  const corePerms = [
    { code: 'view_dashboard', name: '查看首页' },
    { code: 'manage_users', name: '用户管理' },
    { code: 'view_customers', name: '客户模块' },
    { code: 'view_products', name: '产品模块' },
    { code: 'view_invoices', name: '发票模块' },
    { code: 'view_settings', name: '系统设置' }
  ]
  for (const p of corePerms) {
    await query(
      'insert into permissions(code, name) values($1,$2) on conflict(code) do nothing',
      [p.code, p.name]
    )
  }
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const adminDisplay = process.env.ADMIN_DISPLAY || 'Administrator'
  const res = await query('select id from users where username=$1', [adminUsername])
  let adminId
  if (res.rowCount === 0) {
    const hash = await hashPassword(adminPassword)
    const ins = await query(
      'insert into users(username, password_hash, display_name) values($1,$2,$3) returning id',
      [adminUsername, hash, adminDisplay]
    )
    adminId = ins.rows[0].id
  } else {
    adminId = res.rows[0].id
  }
  // Grant admin all permissions
  const allPerms = await query('select id from permissions')
  for (const row of allPerms.rows) {
    await query(
      'insert into user_permissions(user_id, permission_id) values($1,$2) on conflict do nothing',
      [adminId, row.id]
    )
  }
}
