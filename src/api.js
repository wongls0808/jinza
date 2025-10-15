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
  if (!res.ok) {
    let msg = ''
    try { const j = await res.json(); msg = j?.error || j?.message || '' } catch { msg = await res.text() }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
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
  },
  perms: {
    list: () => request('/permissions')
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
    return res
  },
  deleteBank: async (id) => {
    const res = await request(`/banks/${id}`, { method: 'DELETE' })
    delCache('banks.all')
    return res
  },
  resetBanks: async () => {
    const res = await request('/banks/reset-defaults', { method: 'POST' })
    delCache('banks.all')
    return res
  },
  updateBank: async (id, data) => {
    const res = await request(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    delCache('banks.all')
    return res
  },
  banks: {
    all: async () => {
      const key = 'banks.all'
      const cached = getCache(key)
      if (cached) return cached
      const data = await request('/banks')
      setCache(key, data, 3 * 60 * 1000) // 3 分钟
      return data
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
      approve: (id) => request(`/fx/payments/${id}/approve`, { method: 'POST' }),
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
    getRate: (pair) => request(`/fx/rates?pair=${encodeURIComponent(pair)}`),
    getBocRate: (pair) => request(`/fx/rates/boc?pair=${encodeURIComponent(pair)}`),
    upsertRate: (data) => request('/fx/rates', { method: 'POST', body: JSON.stringify(data) }),
    listOrders: () => request('/fx/buy'),
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
