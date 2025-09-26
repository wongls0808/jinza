import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue';
import { useUserStore } from '@/stores/user';

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
    redirect: '/dashboard/index',
    meta: {
      title: '工作台',
      requireAuth: true,
    },
    children: [
      // 首页
      {
        path: 'index',
        name: 'DashboardIndex',
        component: () => import('@/views/ModernHome.vue'),
        meta: {
          title: '首页',
          requireAuth: true,
          icon: 'HomeFilled',
        }
      }
    ]
  },
  // 系统管理
  {
    path: '/system',
    name: 'System',
    component: MainLayout,
    redirect: '/system/user',
    meta: {
      title: '系统管理',
      requireAuth: true,
      roles: ['admin'], // 需要admin角色才能访问
      icon: 'Setting'
    },
    children: [
      // 用户管理
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: {
          title: '用户管理',
          requireAuth: true,
          roles: ['admin'],
          icon: 'User',
          permissions: ['system:user:list']
        }
      },
      // 角色管理
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: {
          title: '角色管理',
          requireAuth: true,
          roles: ['admin'],
          icon: 'UserFilled',
          permissions: ['system:role:list']
        }
      },
      // 菜单管理
      {
        path: 'menu',
        name: 'SystemMenu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: {
          title: '菜单管理',
          requireAuth: true,
          roles: ['admin'],
          icon: 'Menu',
          permissions: ['system:menu:list']
        }
      },
      // 账套管理
      {
        path: 'tenant',
        name: 'SystemTenant',
        component: () => import('@/views/system/tenant/index.vue'),
        meta: {
          title: '账套管理',
          requireAuth: true,
          roles: ['admin'],
          icon: 'Office',
          permissions: ['system:tenant:list']
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
  document.title = `${to.meta.title as string} - Jinza多账套管理系统`;
  
  // 判断是否需要登录权限
  if (to.meta.requireAuth as boolean) {
    const token = localStorage.getItem('token');
    if (token) {
      // 获取用户store
      const userStore = useUserStore();
      
      // 验证是否有访问该路由的权限
      if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
        // 需要特定角色
        const hasRole = to.meta.roles.some(role => userStore.hasRole(role));
        if (!hasRole) {
          next({ path: '/dashboard' });
          return;
        }
      }
      
      // 验证是否有访问该路由的权限
      if (to.meta.permissions && Array.isArray(to.meta.permissions) && to.meta.permissions.length > 0) {
        // 需要特定权限
        const hasPermission = to.meta.permissions.some(permission => 
          userStore.hasPermission(permission)
        );
        if (!hasPermission) {
          next({ path: '/dashboard' });
          return;
        }
      }
      
      // 通过权限验证
      next();
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    }
  } else {
    next();
  }
});

export default router;