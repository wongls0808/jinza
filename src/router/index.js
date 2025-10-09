import { createRouter, createWebHistory } from 'vue-router'

// Views
import Home from '@/views/Home.vue'

const Login = () => import('@/views/Login.vue')
const Customers = () => import('@/views/Customers.vue')
const Products = () => import('@/views/Products.vue')
const Invoices = () => import('@/views/Invoices.vue')
const Settings = () => import('@/views/Settings.vue')

export const routes = [
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/', name: 'home', component: Home },
  { path: '/customers', name: 'customers', component: Customers },
  { path: '/products', name: 'products', component: Products },
  { path: '/invoices', name: 'invoices', component: Invoices },
  { path: '/settings', name: 'settings', component: Settings },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 简单登录状态与守卫（演示用）
const isAuthed = () => {
  try { return !!JSON.parse(localStorage.getItem('auth_user')) } catch { return false }
}

router.beforeEach((to, from, next) => {
  if (to.meta.public) return next()
  if (!isAuthed()) return next({ name: 'login', query: { redirect: to.fullPath } })
  next()
})

export default router