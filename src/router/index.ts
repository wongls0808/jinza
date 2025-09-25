import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      requireAuth: false,
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: MainLayout,
    children: [
      // 首页
      {
        path: '',
        name: 'DashboardIndex',
        component: () => import('@/views/Home.vue'),
        meta: {
          title: '首页',
          requireAuth: true,
          icon: 'HomeFilled',
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '404',
      requireAuth: false,
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title as string} - Jinza管理系统`;
  
  // 判断是否需要登录权限
  if (to.meta.requireAuth as boolean) {
    const token = localStorage.getItem('token');
    if (token) {
      next();
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    }
  } else {
    next();
  }
});

export default router;