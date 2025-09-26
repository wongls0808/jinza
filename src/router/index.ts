import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'ModernHome',
    component: () => import('@/views/ModernHome.vue'),
    meta: { title: '首页', requireAuth: false }
  },
  {
    path: '/test',
    name: 'TestPing',
    component: () => import('@/views/TestPing.vue'),
    meta: { title: '后端连通性测试', requireAuth: false }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/Index.vue'),
    meta: { title: '系统设置', requireAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404', requireAuth: false }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title as string} - Jinza`;
  next();
});

export default router;