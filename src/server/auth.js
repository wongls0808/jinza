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
    // 显式允许通过环境变量绕过鉴权（仅用于临时联调），默认不启用
    if (process.env.NODE_ENV !== 'production' && process.env.AUTH_BYPASS === '1') {
      req.user = {
        id: 1,
        username: 'admin',
        is_admin: true,
        perms: [
          'view_dashboard','manage_users','view_customers','view_banks','view_accounts','view_transactions',
          'manage_transactions','delete_transactions','view_settings','view_fx','manage_fx','delete_fx'
        ]
      }
      return next()
    }
    
    // 正常身份验证逻辑（所有环境）
    const auth = req.headers.authorization
    if (!auth) {
      if (required) return res.status(401).json({ error: 'Unauthorized' })
      req.user = null
      return next()
    }
    const token = auth.replace('Bearer ', '')
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      // 会话校验：要求 JWT 中包含会话 sid，并在 user_sessions 表中存在且未过期
      req.user = decoded
      try {
        // 允许缺少数据库时跳过（例如未配置 DATABASE_URL 的纯前端预览）
        if (process.env.DATABASE_URL) {
          if (!decoded.sid) return res.status(401).json({ error: 'Invalid session' })
          const rs = await query(
            `select user_id, last_seen from user_sessions where token=$1 limit 1`,
            [decoded.sid]
          )
          if (rs.rowCount === 0) return res.status(401).json({ error: 'Session expired' })
          const lastSeen = new Date(rs.rows[0].last_seen)
          const now = new Date()
          const idleMs = now.getTime() - lastSeen.getTime()
          const maxIdle = Number(process.env.SESSION_IDLE_MS || 30 * 60 * 1000) // 默认 30 分钟
          if (idleMs > maxIdle) {
            // 过期则移除会话
            try { await query('delete from user_sessions where token=$1', [decoded.sid]) } catch {}
            return res.status(401).json({ error: 'Session expired' })
          }
          // 刷新 last_seen 与 IP/UA
          const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || '').trim()
          const ua = (req.headers['user-agent'] || '').slice(0, 300)
          try { await query('update user_sessions set last_seen=now(), last_ip=$1, user_agent=$2 where token=$3', [ip, ua, decoded.sid]) } catch {}
        }
      } catch {}
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
      is_admin boolean default false,
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
      tax_rate numeric(6,3) default 0,
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
  // Bank logos table (fallback ensure)
  try {
    await query(`
      create table if not exists bank_logos (
        bank_id int primary key references banks(id) on delete cascade,
        mime text not null,
        data bytea not null,
        updated_at timestamptz default now()
      );
    `)
  } catch {}
  // 用户会话（单端登录 + 空闲超时）
  await query(`
    create table if not exists user_sessions (
      id serial primary key,
      user_id int not null references users(id) on delete cascade,
      token text unique not null,
      last_seen timestamptz not null default now(),
      last_ip text,
      user_agent text,
      created_at timestamptz default now()
    );
    create index if not exists ix_user_sessions_user on user_sessions(user_id);
    create index if not exists ix_user_sessions_last_seen on user_sessions(last_seen);
  `)
  // 用户行为日志（保留 60 天）
  await query(`
    create table if not exists user_activity (
      id serial primary key,
      user_id int not null references users(id) on delete cascade,
      action text not null,
      meta jsonb,
      ip text,
      user_agent text,
      created_at timestamptz default now()
    );
    create index if not exists ix_user_activity_user on user_activity(user_id);
    create index if not exists ix_user_activity_created on user_activity(created_at);
  `)
  // Add columns if the table pre-existed
  await query(`alter table users add column if not exists must_change_password boolean default false`)
  await query(`alter table users add column if not exists password_updated_at timestamptz`)
  await query(`alter table users add column if not exists is_admin boolean default false`)
  // 升级已存在列的精度（若之前为 numeric 或其他数值类型）
  try { await query(`alter table customers alter column tax_rate type numeric(6,3) using round(coalesce(tax_rate,0)::numeric, 3)`) } catch {}
  // 迁移：若历史数据以系数(0..1)存储，则转换为百分比 p=(1 - f)*100；保证幂等：仅转换 0<=tax_rate<=1 的行
  try {
    // 注意：排除 0，避免 0 被错误转换为 100
    await query(`update customers set tax_rate = round((1 - coalesce(tax_rate,0)) * 100, 3) where coalesce(tax_rate,0) > 0 and coalesce(tax_rate,0) <= 1`)
  } catch {}
}

// 记录行为（忽略错误），用于重要操作审计；action 如 'login','logout','users.update','permissions.update'
export async function logActivity(userId, action, meta = {}, reqLike = null) {
  try {
    if (!process.env.DATABASE_URL) return
    const ip = (reqLike?.headers?.['x-forwarded-for']?.toString().split(',')[0] || reqLike?.ip || '').trim()
    const ua = (reqLike?.headers?.['user-agent'] || '').slice(0, 300)
    await query(
      `insert into user_activity(user_id, action, meta, ip, user_agent) values($1,$2,$3,$4,$5)`,
      [Number(userId)||null, String(action)||'', meta ? JSON.stringify(meta) : null, ip || null, ua || null]
    )
  } catch {}
}

// 清理过期行为日志（>60天），忽略错误；可在定时任务或登录时机调用
export async function cleanupOldActivity(days = 60) {
  try {
    if (!process.env.DATABASE_URL) return
    await query(`delete from user_activity where created_at < now() - ($1::int || ' days')::interval`, [Number(days)||60])
  } catch {}
}

export async function seedInitialAdmin() {
  // Seed default admin user and core permissions if absent
  const corePerms = [
    { code: 'view_dashboard', name: '查看首页' },
    { code: 'manage_users', name: '用户管理' },
    { code: 'view_customers', name: '客户模块' },
    { code: 'view_banks', name: '银行列表' },
    { code: 'view_accounts', name: '收款账户' },
    { code: 'view_transactions', name: '交易管理' },
    // 交易写入与删除权限（用于新增/编辑/批量删除等操作）
    { code: 'manage_transactions', name: '交易写入' },
    { code: 'delete_transactions', name: '交易删除' },
    { code: 'view_settings', name: '系统设置' },
    // FX 模块权限
    { code: 'view_fx', name: '结汇管理-查看' },
    { code: 'manage_fx', name: '结汇管理-编辑' },
    { code: 'delete_fx', name: '结汇管理-删除' }
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
      'insert into users(username, password_hash, display_name, is_admin, must_change_password) values($1,$2,$3,$4,$5) returning id',
      [adminUsername, hash, adminDisplay, true, true]
    )
    adminId = ins.rows[0].id
  } else {
    adminId = res.rows[0].id
    // 确保已有管理员账号被标记为 is_admin
    try { await query('update users set is_admin=true where id=$1', [adminId]) } catch {}
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
    // UI-only 权限模式：放行所有权限检查（仍需登录）
    if (process.env.NODE_ENV !== 'production' && process.env.PERM_UI_ONLY === '1') return next()
    // 管理员直接放行
    if (req.user && req.user.is_admin) return next()

    // 正常权限检查
    const perms = (req.user && req.user.perms) || []
    if (!perms.includes(code)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

// 判断是否拥有指定权限码
export function hasPerm(req, code) {
  if (!req || !req.user) return false
  // UI-only 权限模式：视为拥有所有权限（仍需登录）
  if (process.env.NODE_ENV !== 'production' && process.env.PERM_UI_ONLY === '1') return true
  if (req.user.is_admin) return true
  const perms = Array.isArray(req.user.perms) ? req.user.perms : []
  return perms.includes(code)
}

// 至少满足任意一个权限码
export function requireAnyPerm(...codes) {
  const flat = codes.flat().filter(Boolean)
  return (req, res, next) => {
    // UI-only 权限模式：放行所有权限检查（仍需登录）
    if (process.env.NODE_ENV !== 'production' && process.env.PERM_UI_ONLY === '1') return next()
    if (req.user && req.user.is_admin) return next()
    const perms = (req.user && req.user.perms) || []
    const ok = flat.some(c => perms.includes(c))
    if (!ok) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

// 放宽读取：
// - 对 GET 请求不做权限拦截（仅需登录），用于基础数据/联动下拉等读取，避免前端因为缺少查看权限而无法使用
// - 对非 GET 请求（写操作）仍按 requireAnyPerm 校验
export function readOpenOr(...codes) {
  const guard = requireAnyPerm(...codes)
  return (req, res, next) => {
    // UI-only 权限模式：放行所有权限检查（仍需登录）
    if (process.env.NODE_ENV !== 'production' && process.env.PERM_UI_ONLY === '1') return next()
    if (String(req.method || '').toUpperCase() === 'GET') return next()
    return guard(req, res, next)
  }
}
