import { createRouter, createWebHistory } from 'vue-router'

// Views
import Home from '@/views/Home.vue'
const UserManagement = () => import('@/views/UserManagement.vue')
const ChangePassword = () => import('@/views/ChangePassword.vue')

const Login = () => import('@/views/Login.vue')
const Customers = () => import('@/views/Customers.vue')
const Products = () => import('@/views/Products.vue')
const Invoices = () => import('@/views/Invoices.vue')
const Settings = () => import('@/views/Settings.vue')
const NoAccess = () => import('@/views/NoAccess.vue')

export const routes = [
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/change-password', name: 'change-password', component: ChangePassword, meta: { public: false } },
  { path: '/', name: 'home', component: Home, meta: { perm: 'view_dashboard' } },
  { path: '/users', name: 'users', component: UserManagement, meta: { perm: 'manage_users' } },
  { path: '/customers', name: 'customers', component: Customers, meta: { perm: 'view_customers' } },
  { path: '/products', name: 'products', component: Products, meta: { perm: 'view_products' } },
  { path: '/invoices', name: 'invoices', component: Invoices, meta: { perm: 'view_invoices' } },
  { path: '/settings', name: 'settings', component: Settings, meta: { perm: 'view_settings' } },
  { path: '/no-access', name: 'no-access', component: NoAccess, meta: { public: false } },
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

// 计算一个用户可访问的首个页面，避免因权限不足跳转到自身而循环
function firstAllowed(perms) {
  const order = ['home','users','customers','products','invoices','settings']
  for (const name of order) {
    const r = routes.find(r => r.name === name)
    if (!r) continue
    const need = r.meta?.perm
    if (!need || perms.includes(need)) return { name }
  }
  // 若没有任何匹配，回到登录页
  return { name: 'no-access' }
}

router.beforeEach((to, from, next) => {
  if (to.meta.public) return next()
  const { token, perms, must_change_password } = readAuth()
  if (!token) return next({ name: 'login', query: { redirect: to.fullPath } })
  if (must_change_password && to.name !== 'change-password') return next({ name: 'change-password' })
  const need = to.meta.perm
  if (need && !perms.includes(need)) {
    const target = firstAllowed(perms)
    // 避免跳转到同名路由导致循环
    if (target.name === to.name) return next()
    return next(target)
  }
  next()
})

export default router