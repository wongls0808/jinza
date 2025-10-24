import { publicConfig } from './config.js'

const API_BASE = publicConfig.apiBaseUrl
// 简易内存缓存（页面会刷新失效），用于字典接口减轻重复请求
const _cache = new Map() // key -> { time: number, data: any, ttl: number }
function setCache(key, data, ttlMs) { _cache.set(key, { time: Date.now(), data, ttl: ttlMs }) }
function getCache(key) {
  const it = _cache.get(key)
  if (!it) return null
  if (Date.now() - it.time > (it.ttl || 0)) { _cache.delete(key); return null }
  return it.data
}
function delCache(key) { _cache.delete(key) }

// ---- Banks 更新事件（让各页面可订阅并自动刷新）----
const BANKS_UPDATED_EVENT = 'banks:updated'
function emitBanksUpdated() {
  try { window && window.dispatchEvent && window.dispatchEvent(new CustomEvent(BANKS_UPDATED_EVENT)) } catch {}
  try { localStorage.setItem('banks.lastUpdated', String(Date.now())) } catch {}
}

function getToken() {
  // 优先从会话存储读取，保证“关闭浏览器需重登”的逻辑生效
  try {
    const ss = sessionStorage.getItem('auth_user')
    if (ss) {
      const data = JSON.parse(ss)
      if (data?.token) return data.token
    }
  } catch {}

  // 回退到本地存储（支持“记住我”场景）
  try {
    const ls = localStorage.getItem('auth_user')
    if (!ls) return null
    const data = JSON.parse(ls)
    return data?.token || null
  } catch { return null }
}

export async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  
  // 统一读取响应体文本
  const responseText = await res.text()
  
  if (!res.ok) {
    if (res.status === 401) {
      try {
        sessionStorage.removeItem('auth_user'); sessionStorage.removeItem('auth_session')
        localStorage.removeItem('auth_user'); localStorage.removeItem('remember_auth')
      } catch {}
      // 避免在登录页循环
      if (typeof window !== 'undefined' && window.location && !/\/login$/.test(window.location.pathname)) {
        window.location.replace('/login')
      }
    }
    let body = null
    let msg = ''
    try {
      // 尝试解析 JSON 响应体
      if (responseText.trim()) {
        body = JSON.parse(responseText)
        msg = body?.error || body?.message || ''
        if (body?.detail) {
          const d = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
          msg = msg ? `${msg}: ${d}` : d
        }
      }
    } catch {
      // JSON 解析失败，使用原始文本
      msg = responseText.trim()
    }
    // 如果仍然没有错误信息，至少提供状态码
    if (!msg) {
      msg = `HTTP ${res.status}`
      if (res.status === 409) msg = `HTTP ${res.status} (冲突)`
      if (res.status === 413) msg = `HTTP ${res.status} (请求过大)`
      if (res.status === 422) msg = `HTTP ${res.status} (数据验证失败)`
      if (res.status >= 500) msg = `HTTP ${res.status} (服务器错误)`
    }
    const err = new Error(msg)
    try { err.status = res.status } catch {}
    try { err.code = body?.code } catch {}
    try { err.raw = body || responseText } catch {}
    throw err
  }
  
  // 处理成功响应
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try {
      return JSON.parse(responseText)
    } catch {
      return responseText
    }
  }
  return responseText
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  users: {
    list: () => request('/users'),
    create: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id, password) => request(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
    getPerms: (id) => request(`/users/${id}/permissions`),
    setPerms: (id, perms) => request(`/users/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ perms }) }),
    sessions: (id) => request(`/users/${id}/sessions`),
  },
  system: {
    health: () => request('/system/health'),
    tables: (exact=true) => request(`/system/tables?exact=${exact?1:0}`),
    backup: async () => {
      // 返回 blob 由调用方触发下载
      const token = (function(){
        try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
        try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
        return null
      })()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      // 强制全量备份：无需传入表清单
      const res = await fetch(`${API_BASE}/system/backup`, { method: 'POST', headers, body: JSON.stringify({}) })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()
      // 尝试获取服务端文件名
      const cd = res.headers.get('Content-Disposition') || ''
      let filename = 'DataBackup.zip'
      try {
        const mUtf8 = cd.match(/filename\*=UTF-8''([^;]+)/i)
        if (mUtf8) filename = decodeURIComponent(mUtf8[1])
        else {
          const m = cd.match(/filename="?([^";]+)"?/i)
          if (m) filename = m[1]
        }
      } catch {}
      return { blob, filename }
    },
    restore: async (file) => {
      const token = (function(){
        try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
        try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
        return null
      })()
      const fd = new FormData()
      fd.append('file', file)
      // 强制清表恢复：不再传递 mode
      const headers = { }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/system/restore`, { method: 'POST', headers, body: fd })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    backups: {
      list: (limit=20) => request(`/system/backups?limit=${limit}`),
      triggerNow: () => request('/system/backup-now', { method: 'POST', body: JSON.stringify({}) }),
      download: async (file) => {
        if (!file) throw new Error('file required')
        const token = (function(){
          try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          return null
        })()
        const headers = { }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/system/backups/download?${new URLSearchParams({ file }).toString()}` , { headers })
        if (!res.ok) throw new Error(await res.text())
        const blob = await res.blob()
        // name from query file or response header
        const cd = res.headers.get('Content-Disposition') || ''
        let filename = file
        try {
          const mUtf8 = cd.match(/filename\*=UTF-8''([^;]+)/i)
          if (mUtf8) filename = decodeURIComponent(mUtf8[1])
          else {
            const m = cd.match(/filename="?([^";]+)"?/i)
            if (m) filename = m[1]
          }
        } catch {}
        return { blob, filename }
      }
    }
  },
  perms: {
    list: () => request('/permissions'),
    tree: () => request('/permissions/tree'),
    reseed: (reset=false) => request('/permissions/reseed', { method: 'POST', body: JSON.stringify({ reset }) })
  },
  changePassword: (old_password, new_password) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) }),
  customers: {
    list: (params={}) => request(`/customers?${new URLSearchParams(params).toString()}`),
    create: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    removeBatch: async (ids) => {
      try {
        return await request('/customers/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) })
      } catch (e) {
        // 回退：部分旧服务端可能没有该端点
        return await request('/customers', { method: 'DELETE', body: JSON.stringify({ ids }) })
      }
    },
    importRows: (rows) => request('/customers/import', { method: 'POST', body: JSON.stringify({ rows }) }),
    importCsv: (text) => request('/customers/import-csv', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: text }),
    exportCsv: () => request('/customers/export'),
    template: () => request('/customers/template')
  }
  ,
  // Banks
  requestBanks: () => request('/banks'),
  createBank: async (data) => {
    const res = await request('/banks', { method: 'POST', body: JSON.stringify(data) })
    delCache('banks.all')
    emitBanksUpdated()
    return res
  },
  deleteBank: async (id) => {
    const res = await request(`/banks/${id}`, { method: 'DELETE' })
    delCache('banks.all')
    emitBanksUpdated()
    return res
  },
  resetBanks: async () => {
    const res = await request('/banks/reset-defaults', { method: 'POST' })
    delCache('banks.all')
    emitBanksUpdated()
    return res
  },
  updateBank: async (id, data) => {
    const res = await request(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    delCache('banks.all')
    emitBanksUpdated()
    return res
  },
  banks: {
    checkCode: async (code) => {
      const q = new URLSearchParams({ code: String(code||'').trim().toUpperCase() }).toString()
      return request(`/banks/validate-code?${q}`)
    },
    all: async () => {
      const key = 'banks.all'
      const cached = getCache(key)
      if (cached) return cached
      const data = await request('/banks')
      setCache(key, data, 3 * 60 * 1000) // 3 分钟
      return data
    }
    ,
    onUpdated: (handler) => {
      if (typeof handler !== 'function') return () => {}
      const fn = () => { try { handler() } catch {} }
      try { window.addEventListener(BANKS_UPDATED_EVENT, fn) } catch {}
      // 跨标签页同步（同标签也无害）
      const storageFn = (e) => { if (e && e.key === 'banks.lastUpdated') fn() }
      try { window.addEventListener('storage', storageFn) } catch {}
      return () => {
        try { window.removeEventListener(BANKS_UPDATED_EVENT, fn) } catch {}
        try { window.removeEventListener('storage', storageFn) } catch {}
      }
    }
  },

  // Currencies
  currencies: {
    list: async () => {
      const key = 'currencies.list'
      const cached = getCache(key)
      if (cached) return cached
      const data = await request('/currencies')
      setCache(key, data, 5 * 60 * 1000) // 5 分钟
      return data
    },
    create: (code, name) => request('/currencies', { method: 'POST', body: JSON.stringify({ code, name }) }),
    remove: (code) => request(`/currencies/${code}`, { method: 'DELETE' })
  },

  // Accounts
  accounts: {
    list: (params={}) => request(`/accounts?${new URLSearchParams(params).toString()}`),
    create: (data) => request('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/accounts/${id}`, { method: 'DELETE' })
  },

  // Customer Accounts
  customerAccounts: {
    list: (customerId) => request(`/customers/${customerId}/accounts`),
    create: (customerId, data) => request(`/customers/${customerId}/accounts`, { method: 'POST', body: JSON.stringify(data) }),
    remove: (customerId, id) => request(`/customers/${customerId}/accounts/${id}`, { method: 'DELETE' }),
    update: (customerId, id, data) => request(`/customers/${customerId}/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  
  // 交易管理API
  transactions: {
    list: (params={}) => request(`/transactions?${new URLSearchParams(params).toString()}`),
    stats: (params={}) => request(`/transactions/stats?${new URLSearchParams(params).toString()}`),
    export: (params={}) => request(`/transactions/export?${new URLSearchParams(params).toString()}`),
    match: (id, payload) => request(`/transactions/${id}/match`, { method: 'POST', body: JSON.stringify(payload) }),
    unmatch: (id) => request(`/transactions/${id}/unmatch`, { method: 'POST' }),
    deleteTransactions: (ids) => request('/transactions/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    create: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
    // 固定格式银行对账单：CSV 文本导入
    importCsvText: async (text) => {
      // 使用 fetch 发送 text/plain，带鉴权头
      const token = (function(){
        try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
        try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
        return null
      })()
      const headers = { 'Content-Type': 'text/plain;charset=utf-8' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/transactions/import-csv`, { method: 'POST', headers, body: text })
      if (!res.ok) {
        let msg = ''
        try { const j = await res.json(); msg = j?.error || j?.message || '' } catch { msg = await res.text() }
        throw new Error(msg || `HTTP ${res.status}`)
      }
      return res.json()
    }
  },
  // 返回收款账户列表（仅 items 数组，便于选择器直接使用）
  // FX - 结汇/付款
  fx: {
    settlements: {
      list: (params={}) => request(`/fx/settlements?${new URLSearchParams(params).toString()}`),
      exportListCsv: async (params={}) => {
        const token = (function(){
          try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          return null
        })()
        const headers = { }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const url = `/fx/settlements/export?${new URLSearchParams(params).toString()}`
        const res = await fetch(`${API_BASE}${url}`, { headers })
        if (!res.ok) throw new Error(await res.text())
        return res.text()
      },
      detail: (id) => request(`/fx/settlements/${id}`),
      exportCsv: async (id) => {
        // 直接返回文本（CSV），由调用方触发下载
        const token = (function(){
          try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          return null
        })()
        const headers = { }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/fx/settlements/${id}/export`, { headers })
        if (!res.ok) throw new Error(await res.text())
        return res.text()
      },
      create: (data) => request('/fx/settlements', { method: 'POST', body: JSON.stringify(data) })
    },
    payments: {
      list: (params={}) => request(`/fx/payments?${new URLSearchParams(params).toString()}`),
      exportListCsv: async (params={}) => {
        const token = (function(){
          try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          return null
        })()
        const headers = { }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const url = `/fx/payments/export?${new URLSearchParams(params).toString()}`
        const res = await fetch(`${API_BASE}${url}`, { headers })
        if (!res.ok) throw new Error(await res.text())
        return res.text()
      },
      detail: (id) => request(`/fx/payments/${id}`),
      exportCsv: async (id) => {
        const token = (function(){
          try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          return null
        })()
        const headers = { }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/fx/payments/${id}/export`, { headers })
        if (!res.ok) throw new Error(await res.text())
        return res.text()
      },
  approve: (id, data) => request(`/fx/payments/${id}/approve`, { method: 'POST', body: JSON.stringify(data||{}) }),
  unapprove: (id) => request(`/fx/payments/${id}/unapprove`, { method: 'POST' }),
  audits: (id) => request(`/fx/payments/${id}/audits`),
  batchApprove: (ids, platform_id) => request(`/fx/payments/batch-approve`, { method: 'POST', body: JSON.stringify({ ids, platform_id }) }),
      exportPdf: async (id) => {
        const token = (function(){
          try { const s = sessionStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          try { const s = localStorage.getItem('auth_user'); if (s) { const d = JSON.parse(s); if (d?.token) return d.token } } catch{}
          return null
        })()
        const headers = { }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/fx/payments/${id}/pdf`, { headers })
        if (!res.ok) throw new Error(await res.text())
        const blob = await res.blob()
        // 从 Content-Disposition 获取服务端文件名（UTF-8）
        const cd = res.headers.get('Content-Disposition') || ''
        let serverFileName = null
        // 解析 filename*=UTF-8''xxx 或 filename="xxx"
        try {
          const mUtf8 = cd.match(/filename\*=UTF-8''([^;]+)/i)
          if (mUtf8) serverFileName = decodeURIComponent(mUtf8[1])
          else {
            const m = cd.match(/filename="?([^";]+)"?/i)
            if (m) serverFileName = m[1]
          }
        } catch {}
        return { blob, filename: serverFileName }
      },
      // receipt unified to exportPdf
      create: (data) => request('/fx/payments', { method: 'POST', body: JSON.stringify(data) })
    }
  },
  buyfx: {
    listPlatforms: () => request('/fx/platforms'),
    savePlatform: (m) => request('/fx/platforms', { method: 'POST', body: JSON.stringify(m) }),
    deletePlatform: (id) => request(`/fx/platforms/${id}`, { method: 'DELETE' }),
    // 实时汇率接口已移除，改为手工录入汇率
  // 历史记录改用平台内互换记录
  listOrders: () => request('/fx/transfers'),
  // 平台内币种互换记录（最近200条）
  listTransfers: () => request('/fx/transfers'),
  // 平台支出（付款审核时产生）
  listPlatformExpenses: (platformId, params={}) => request(`/fx/platforms/${platformId}/expenses?${new URLSearchParams(params).toString()}`),
  // 平台统一账目（买=贷、卖=借、支出=借）
  listPlatformLedger: (platformId, params={}) => request(`/fx/platforms/${platformId}/ledger?${new URLSearchParams(params).toString()}`),
  updateOrderNote: (id, note) => request(`/fx/transfers/${id}`, { method: 'PUT', body: JSON.stringify({ note }) }),
  updateOrder: (id, data) => request(`/fx/transfers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id) => request(`/fx/transfers/${id}`, { method: 'DELETE' }),
  createOrder: (data) => request('/fx/buy', { method: 'POST', body: JSON.stringify(data) }),
    convertPlatformCurrency: (platformId, data) => request(`/fx/platforms/${platformId}/convert`, { method: 'POST', body: JSON.stringify(data) })
  },
  // 按客户拉取已匹配交易，辅助结汇区
  transactionsByCustomer: (customerId, params={}) => request(`/transactions?${new URLSearchParams({ status:'matched', matchTargetId: customerId, ...params }).toString()}`),
  requestAccounts: async () => {
    const res = await request('/accounts')
    // 服务端返回形如 { total, items }，这里仅透出 items
    if (res && Array.isArray(res.items)) return res.items
    // 兼容异常返回
    if (Array.isArray(res)) return res
    return []
  }
}

// 费用管理 API
export const expensesApi = {
  list: (params={}) => request(`/expenses?${new URLSearchParams(params).toString()}`),
  create: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
  report: (params={}) => request(`/expenses/report?${new URLSearchParams(params).toString()}`)
}

// 为向后兼容，透出到 api 下
export const api2 = api
api.expenses = expensesApi
