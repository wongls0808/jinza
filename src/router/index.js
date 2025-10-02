import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Customers from '../views/Customers.vue';
import Users from '../views/Users.vue';
import AccountSets from '../views/AccountSets.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'login', component: () => import('../views/auth/Login.vue'), meta: { public: true } },
  { path: '/dashboard', name: 'dashboard', component: Dashboard, meta: { title: '仪表盘' } },
  { path: '/customers', name: 'customers', component: Customers, meta: { title: '客户管理' } },
  { path: '/users', name: 'users', component: Users, meta: { title: '用户管理', roles: ['admin'] } },
  { path: '/account-sets', name: 'account-sets', component: AccountSets, meta: { title: '账套管理' } },
];

export function createAppRouter(auth) {
  const router = createRouter({
    history: createWebHistory(),
    routes
  });

  router.beforeEach(async (to, from, next) => {
    if (!auth.initialized) {
      await auth.init();
    }
    if (to.meta.public) return next();
    if (!auth.user) return next({ name: 'login', query: { redirect: to.fullPath } });
    if (to.meta.roles && !to.meta.roles.includes(auth.user.role)) {
      return next({ path: '/dashboard' });
    }
    next();
  });

  return router;
}
