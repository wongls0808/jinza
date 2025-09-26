import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '@/router';
import { useUserStore } from './user';
import type { RouteRecordRaw } from 'vue-router';
import type { MenuItem } from '@/types/menu';

// 从路由生成菜单数据
function generateMenuFromRoutes(routes: RouteRecordRaw[], basePath: string = '', baseId: string = '') {
  const result: MenuItem[] = [];
  
  routes.forEach((route, index) => {
    // 跳过隐藏的路由
    if (route.meta?.hidden) return;
    
    const currentId = baseId ? `${baseId}-${index + 1}` : `${index + 1}`;
    const currentPath = route.path.startsWith('/') ? route.path : `${basePath}/${route.path}`;
    
    const menuItem: MenuItem = {
      id: currentId,
      title: route.meta?.title as string || route.name as string,
      path: route.redirect ? undefined : currentPath,
      icon: route.meta?.icon as string
    };
    
    // 处理子路由
    if (route.children && route.children.length > 0) {
      const visibleChildren = route.children.filter(child => !child.meta?.hidden);
      if (visibleChildren.length) {
        menuItem.children = generateMenuFromRoutes(
          visibleChildren,
          currentPath,
          currentId
        );
      }
    }
    
    result.push(menuItem);
  });
  
  return result;
}

// 系统管理菜单 - 仅管理员可见
const systemManagementMenus: MenuItem[] = [
  {
    id: 'system',
    title: '系统管理',
    icon: 'Setting',
    children: [
      {
        id: 'system-user',
        title: '用户管理',
        path: '/system/user',
        icon: 'User'
      },
      {
        id: 'system-role',
        title: '角色管理',
        path: '/system/role',
        icon: 'UserFilled'
      },
      {
        id: 'system-menu',
        title: '菜单管理',
        path: '/system/menu',
        icon: 'Menu'
      },
      {
        id: 'system-tenant',
        title: '账套管理',
        path: '/system/tenant',
        icon: 'Office'
      }
    ]
  }
];

export const useMenuStore = defineStore('menu', () => {
  const userStore = useUserStore();
  
  // 菜单项
  const menuItems = ref<MenuItem[]>([
    {
      id: '1',
      title: '首页',
      path: '/home',
      icon: 'HomeFilled'
    }
  ]);

  // 顶部/主要模块 - 添加“基础设置”作为主模块入口
  const mainModules: MenuItem[] = [
    {
      id: 'settings',
      title: '基础设置',
      path: '/settings',
      icon: 'Setting'
    }
  ];
  
  // 根据权限过滤的菜单
  const filteredMenuItems = computed(() => {
    // 基本菜单
    let menus = [...menuItems.value];
    
    // 如果是管理员，添加系统管理菜单
    if (userStore.hasRole && userStore.hasRole('admin')) {
      menus = [...menus, ...systemManagementMenus];
    }
    // 添加主模块（如基础设置）到最前面
    menus = [...mainModules, ...menus];
    
    return menus;
  });
  
  // 从路由生成菜单
  const generateMenusFromRoutes = () => {
    // 尝试找到 Dashboard 路由并使用其 children 生成菜单
    const dashboardRoute = router.getRoutes().find(route => route.name === 'Dashboard');
    if (dashboardRoute && Array.isArray(dashboardRoute.children) && dashboardRoute.children.length > 0) {
      // 生成子路由菜单，并确保 path 拼接基准为 /dashboard
      const childrenMenus = generateMenuFromRoutes(dashboardRoute.children, '/dashboard');
      menuItems.value = childrenMenus;
      return;
    }

    // 回退：直接使用顶层路由列表中的可见路由
    const routes = router.getRoutes().filter(r => !r.meta?.hidden && r.path && r.name);
    menuItems.value = generateMenuFromRoutes(routes, '');
  };
  
  // 根据权限过滤菜单
  const filterMenuByPermissions = () => {
    // 实际项目中，这里会基于用户权限来过滤菜单
    // 目前简化处理，通过角色来过滤
    return filteredMenuItems.value;
  };
  
  // 从服务器获取菜单数据
  const fetchMenuFromServer = async () => {
    // 实际应用中，这里应该从服务器获取菜单数据
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // 保持现有菜单不变，实际应用中这里会更新菜单
        generateMenusFromRoutes();
        resolve();
      }, 300);
    });
  };
  
  return {
    menuItems,
    filteredMenuItems,
    generateMenuFromRoutes: generateMenusFromRoutes,
    filterMenuByPermissions,
    fetchMenuFromServer
  };
});