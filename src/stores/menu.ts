import { defineStore } from 'pinia';

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

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    menuItems: [
      {
        id: '1',
        title: '控制台',
        path: '/dashboard',
        icon: 'HomeFilled'
      },
      {
        id: '2',
        title: '内容管理',
        icon: 'Document',
        children: [
          {
            id: '2-1',
            title: '内容列表',
            path: '/dashboard/content'
          },
          {
            id: '2-2',
            title: '分类管理',
            path: '/dashboard/categories'
          }
        ]
      },
      {
        id: '3',
        title: '系统设置',
        icon: 'Setting',
        children: [
          {
            id: '3-1',
            title: '基础设置',
            path: '/dashboard/settings'
          },
          {
            id: '3-2',
            title: '用户管理',
            path: '/dashboard/users'
          }
        ]
      }
    ]
  }),
  
  getters: {
    getMenuItems: (state) => state.menuItems
  },
  
  actions: {
    // 这里可以添加动态生成菜单的逻辑
    async fetchMenuFromServer() {
      // 实际应用中，这里应该从服务器获取菜单数据
      // 现在只是一个模拟实现
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // 保持现有菜单不变，实际应用中这里会更新菜单
          resolve();
        }, 300);
      });
    }
  }
});