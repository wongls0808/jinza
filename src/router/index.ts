import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requireAuth: false,
    }
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
    redirect: '/dashboard/index',
    meta: {
      title: '控制台',
      requireAuth: true,
    },
    children: [
      {
        path: 'index',
        name: 'DashboardIndex',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '控制台',
          requireAuth: true,
        }
      },
      {
        path: 'content',
        name: 'Content',
        component: () => import('@/views/content/ContentList.vue'),
        meta: {
          title: '内容列表',
          requireAuth: true,
        }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/content/Categories.vue'),
        meta: {
          title: '分类管理',
          requireAuth: true,
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/system/Settings.vue'),
        meta: {
          title: '基础设置',
          requireAuth: true,
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/system/Users.vue'),
        meta: {
          title: '用户管理',
          requireAuth: true,
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