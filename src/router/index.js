import { createRouter, createWebHistory } from 'vue-router'

// Views
import Home from '@/views/Home.vue'
const UserManagement = () => import('@/views/UserManagement.vue')
const ChangePassword = () => import('@/views/ChangePassword.vue')

const Login = () => import('@/views/Login.vue')
const Customers = () => import('@/views/Customers.vue')
const Banks = () => import('@/views/Banks.vue')
const Accounts = () => import('@/views/Accounts.vue')
const Settings = () => import('@/views/Settings.vue')
const NoAccess = () => import('@/views/NoAccess.vue')
const Transactions = () => import('@/views/TransactionsView.vue')
const TransactionsStats = () => import('@/views/TransactionsStats.vue')
const FXManagement = () => import('@/views/FXManagement.vue')
const FXSettlements = () => import('@/views/FXSettlements.vue')
const FXPayments = () => import('@/views/FXPayments.vue')
const BuyFX = () => import('@/views/BuyFX.vue')

export const routes = [
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/change-password', name: 'change-password', component: ChangePassword, meta: { public: false } },
  { path: '/', name: 'home', component: Home, meta: { perm: 'view_dashboard' } },
  { path: '/users', name: 'users', component: UserManagement, meta: { perm: 'manage_users' } },
  { path: '/customers', name: 'customers', component: Customers, meta: { perm: 'view_customers' } },
  { path: '/banks', name: 'banks', component: Banks, meta: { perm: 'view_banks' } },
  { path: '/accounts', name: 'accounts', component: Accounts, meta: { perm: 'view_accounts' } },
  { path: '/transactions', name: 'transactions', component: Transactions, meta: { perm: 'view_transactions' } },
  { path: '/transactions/stats', name: 'transactions-stats', component: TransactionsStats, meta: { perm: 'view_transactions' } },
  { path: '/fx', name: 'fx', component: FXManagement, meta: { perm: 'view_fx' } },
  { path: '/fx/settlements', name: 'fx-settlements', component: FXSettlements, meta: { perm: 'view_fx' } },
  { path: '/fx/payments', name: 'fx-payments', component: FXPayments, meta: { perm: 'view_fx' } },
  { path: '/fx/buy', name: 'fx-buy', component: BuyFX, meta: { perm: 'view_fx' } },
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
    // 优先从会话存储中读取认证信息
    let data = JSON.parse(sessionStorage.getItem('auth_user') || 'null')
    
    // 如果会话存储中没有，且设置了"记住我"，则从本地存储中读取
    const rememberAuth = localStorage.getItem('remember_auth') === '1'
    if (!data && rememberAuth) {
      data = JSON.parse(localStorage.getItem('auth_user') || 'null')
      
      // 如果从本地存储中恢复了数据，同步到会话存储中
      if (data) {
        sessionStorage.setItem('auth_user', JSON.stringify(data))
      }
    }
    
    if (!data) return { token: null, perms: [] }
    return { token: data.token, perms: data.perms || [], must_change_password: !!data.must_change_password }
  } catch { return { token: null, perms: [] } }
}

// 计算一个用户可访问的首个页面，避免因权限不足跳转到自身而循环
function firstAllowed(perms) {
  const order = ['home','users','customers','banks','accounts','transactions','settings']
  for (const name of order) {
    const r = routes.find(r => r.name === name)
    if (!r) continue
    const need = r.meta?.perm
    if (!need || perms.includes(need)) return { name }
  }
  // 若没有任何匹配，回到登录页
  return { name: 'no-access' }
}

// 登录校验和权限验证
router.beforeEach((to, from, next) => {
  // 恢复登录验证逻辑
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