import { createRouter, createWebHistory } from 'vue-router'

// Views
const UserManagement = () => import('@/views/UserManagement.vue')
const Customers = () => import('@/views/Customers.vue')
const Banks = () => import('@/views/Banks.vue')
const Accounts = () => import('@/views/Accounts.vue')
const Settings = () => import('@/views/Settings.vue')

export const routes = [
  { path: '/users', name: 'users', component: UserManagement, meta: { perm: 'manage_users' } },
  { path: '/customers', name: 'customers', component: Customers, meta: { perm: 'view_customers' } },
  { path: '/banks', name: 'banks', component: Banks, meta: { perm: 'view_banks' } },
  { path: '/accounts', name: 'accounts', component: Accounts, meta: { perm: 'view_accounts' } },
  { path: '/settings', name: 'settings', component: Settings, meta: { perm: 'view_settings' } },
  { path: '/', redirect: '/users' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 登录与权限检查
const readAuth = () => {
  try {
    const data = JSON.parse(localStorage.getItem('auth_user') || 'null')
    if (!data) return { token: null, perms: [] }
    return { token: data.token, perms: data.perms || [], must_change_password: !!data.must_change_password }
  } catch { return { token: null, perms: [] } }
}

// 权限不足时默认跳转用户管理
function firstAllowed(perms) {
  const order = ['users','customers','banks','accounts','settings']
  for (const name of order) {
    const r = routes.find(r => r.name === name)
    if (!r) continue
    const need = r.meta?.perm
    if (!need || perms.includes(need)) return { name }
  }
  return { name: 'users' }
}

router.beforeEach((to, from, next) => {
  const { token, perms } = readAuth()
  const need = to.meta?.perm
  if (!token) return next({ name: 'users' })
  if (need && !perms.includes(need)) {
    const target = firstAllowed(perms)
    if (target.name === to.name) return next()
    return next(target)
  }
  next()
})

export default router