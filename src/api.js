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
  const raw = localStorage.getItem('auth_user')
  if (!raw) return null
  try { return JSON.parse(raw).token || null } catch { return null }
}

export async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  if (!res.ok) throw new Error(await res.text())
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
    removeBatch: (ids) => request('/customers', { method: 'DELETE', body: JSON.stringify({ ids }) }),
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
    stats: () => request('/transactions/stats')
  }
}
