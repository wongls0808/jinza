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
    // 开发模式：跳过身份验证，使用默认管理员权限
    if (process.env.NODE_ENV !== 'production') {
      // 开发模式下模拟管理员用户
      req.user = {
        id: 1,
        username: 'admin',
        perms: [
          'view_dashboard', 
          'manage_users', 
          'view_customers', 
          'view_banks', 
          'view_accounts', 
          'view_settings'
        ]
      }
      return next()
    }
    
    // 生产模式下的正常身份验证逻辑
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
      must_change_password boolean default false,
      password_updated_at timestamptz,
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

    create table if not exists customers (
      id serial primary key,
      abbr text,
      name text not null,
      tax_rate numeric default 0,
      opening_myr numeric default 0,
      opening_cny numeric default 0,
      submitter text,
      created_at timestamptz default now()
    );

    create table if not exists banks (
      id serial primary key,
      code text unique not null,
      zh text not null,
      en text not null,
      logo_url text,
      created_at timestamptz default now()
    );

    create table if not exists currencies (
      code text primary key,
      name text not null
    );

    create table if not exists receiving_accounts (
      id serial primary key,
      account_name text not null,
      bank_id int references banks(id) on delete restrict,
      bank_account text not null,
      currency_code text references currencies(code) on delete restrict,
      opening_balance numeric default 0,
      created_at timestamptz default now()
    );

    create table if not exists customer_receiving_accounts (
      id serial primary key,
      customer_id int references customers(id) on delete cascade,
      account_name text not null,
      bank_id int references banks(id) on delete restrict,
      bank_account text not null,
      currency_code text references currencies(code) on delete restrict,
      opening_balance numeric default 0,
      created_at timestamptz default now()
    );

    create unique index if not exists ux_cus_acc_customer_bank_no
      on customer_receiving_accounts(customer_id, bank_id, bank_account);
  `)
  // Add columns if the table pre-existed
  await query(`alter table users add column if not exists must_change_password boolean default false`)
  await query(`alter table users add column if not exists password_updated_at timestamptz`)
}

export async function seedInitialAdmin() {
  // Seed default admin user and core permissions if absent
  const corePerms = [
    { code: 'view_dashboard', name: '查看首页' },
    { code: 'manage_users', name: '用户管理' },
    { code: 'view_customers', name: '客户模块' },
    { code: 'view_banks', name: '银行列表' },
    { code: 'view_accounts', name: '收款账户' },
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
      'insert into users(username, password_hash, display_name, must_change_password) values($1,$2,$3,$4) returning id',
      [adminUsername, hash, adminDisplay, true]
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

  // Seed initial bank (ICBC) if missing
  try {
    const has = await query('select id from banks where code=$1', ['ICBC'])
    if (has.rowCount === 0) {
      await query('insert into banks(code, zh, en, logo_url) values($1,$2,$3,$4)', [
        'ICBC',
        '中国工商银行',
        'Industrial and Commercial Bank of China',
        '/banks/icbc.svg'
      ])
    }
  } catch (e) {
    // ignore if banks table doesn't exist yet; ensureSchema should have created it
  }

  // Seed default currencies
  try {
    await query('insert into currencies(code, name) values ($1,$2) on conflict do nothing', ['CNY', '人民币'])
    await query('insert into currencies(code, name) values ($1,$2) on conflict do nothing', ['MYR', '马来西亚林吉特'])
    await query('insert into currencies(code, name) values ($1,$2) on conflict do nothing', ['USD', '美元'])
  } catch {}
}

export function validatePasswordStrength(password) {
  const reasons = []
  if (!password || password.length === 0) {
    reasons.push('密码不能为空')
    return { ok: false, reasons }
  }
  const s = String(password)
  // 1) 全部字符相同，例如 AAAAA
  const allSame = [...s].every(ch => ch === s[0])
  if (allSame) reasons.push('密码过于简单（重复单一字符）')

  // 2) 重复模式，例如 AAABBB、ababab（一个子串重复）
  const repeatedBySubstring = (s + s).slice(1, -1).includes(s)
  if (repeatedBySubstring) reasons.push('密码过于简单（重复模式）')

  // 3) 递增或递减序列，例如 ABCDE 或 12345；检查是否存在长度≥5的单调步进子串
  const lc = s.toLowerCase()
  const isAlphaNum = c => /[a-z0-9]/.test(c)
  const hasMonotonicRun = (runLen = 5) => {
    if (lc.length < runLen) return false
    for (let i = 0; i <= lc.length - runLen; i++) {
      let step = null
      let ok = true
      for (let k = 0; k < runLen - 1; k++) {
        const a = lc[i + k], b = lc[i + k + 1]
        if (!(isAlphaNum(a) && isAlphaNum(b))) { ok = false; break }
        const diff = b.charCodeAt(0) - a.charCodeAt(0)
        if (step === null) {
          if (diff !== 1 && diff !== -1) { ok = false; break }
          step = diff
        } else if (diff !== step) { ok = false; break }
      }
      if (ok) return true
    }
    return false
  }
  if (hasMonotonicRun(5)) reasons.push('密码过于简单（连续序列）')

  return { ok: reasons.length === 0, reasons }
}

export function requirePerm(code) {
  return (req, res, next) => {
    // 开发模式：跳过权限检查
    if (process.env.NODE_ENV !== 'production') {
      return next()
    }
    
    // 生产模式：正常权限检查
    const perms = (req.user && req.user.perms) || []
    if (!perms.includes(code)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
