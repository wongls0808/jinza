const API_BASE = '/api'

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
    exportCsv: () => request('/customers/export'),
    template: () => request('/customers/template')
  }
}
