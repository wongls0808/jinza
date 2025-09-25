import { defineStore } from 'pinia';
import router from '@/router';
import type { RouteRecordRaw } from 'vue-router';

interface MenuItem {
  id: string;
  title: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
}

interface MenuState {
  menuItems: MenuItem[];
}

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

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    menuItems: [
      {
        id: '1',
        title: '首页',
        path: '/dashboard',
        icon: 'HomeFilled'
      }
    ]
  }),
  
  getters: {
    getMenuItems: (state): MenuItem[] => state.menuItems
  },
  
  actions: {
    generateMenuFromRoutes() {
      // 从路由配置生成菜单
      const dashboardRoute = router.getRoutes().find(route => route.name === 'Dashboard');
      if (dashboardRoute && dashboardRoute.children) {
        this.menuItems = generateMenuFromRoutes(dashboardRoute.children);
      }
    },
    
    filterMenuByRole(role: string) {
      // 这里应该根据角色过滤菜单项
      // 实际应用中，这里会根据用户角色来过滤可见的菜单
      return this.menuItems;
    },
    
    async fetchMenuFromServer() {
      // 实际应用中，这里应该从服务器获取菜单数据
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // 保持现有菜单不变，实际应用中这里会更新菜单
          this.generateMenuFromRoutes();
          resolve();
        }, 300);
      });
    }
  }
});