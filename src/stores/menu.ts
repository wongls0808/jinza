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
        title: '管理仪表盘',
        path: '/dashboard/index',
        icon: 'HomeFilled'
      },
      {
        id: '2',
        title: '人力资源',
        icon: 'User',
        children: [
          {
            id: '2-1',
            title: '员工管理',
            path: '/dashboard/hr/employee'
          },
          {
            id: '2-2',
            title: '部门管理',
            path: '/dashboard/hr/department'
          },
          {
            id: '2-3',
            title: '考勤管理',
            path: '/dashboard/hr/attendance'
          }
        ]
      },
      {
        id: '3',
        title: '财务管理',
        icon: 'Money',
        children: [
          {
            id: '3-1',
            title: '发票管理',
            path: '/dashboard/finance/invoice'
          },
          {
            id: '3-2',
            title: '费用管理',
            path: '/dashboard/finance/expense'
          },
          {
            id: '3-3',
            title: '工资管理',
            path: '/dashboard/finance/salary'
          },
          {
            id: '3-4',
            title: '财务报表',
            path: '/dashboard/finance/reports'
          }
        ]
      },
      {
        id: '4',
        title: '库存管理',
        icon: 'Box',
        children: [
          {
            id: '4-1',
            title: '产品管理',
            path: '/dashboard/inventory/product'
          },
          {
            id: '4-2',
            title: '库存状态',
            path: '/dashboard/inventory/stock'
          },
          {
            id: '4-3',
            title: '采购管理',
            path: '/dashboard/inventory/purchase'
          }
        ]
      },
      {
        id: '5',
        title: '项目管理',
        icon: 'Briefcase',
        children: [
          {
            id: '5-1',
            title: '项目列表',
            path: '/dashboard/project/list'
          },
          {
            id: '5-2',
            title: '任务管理',
            path: '/dashboard/project/task'
          }
        ]
      },
      {
        id: '6',
        title: '客户管理',
        icon: 'Service',
        children: [
          {
            id: '6-1',
            title: '客户列表',
            path: '/dashboard/crm/customer'
          },
          {
            id: '6-2',
            title: '联系人管理',
            path: '/dashboard/crm/contact'
          },
          {
            id: '6-3',
            title: '商机管理',
            path: '/dashboard/crm/opportunity'
          },
          {
            id: '6-4',
            title: '合同管理',
            path: '/dashboard/crm/contract'
          }
        ]
      },
      {
        id: '7',
        title: '审批流程',
        icon: 'DocumentChecked',
        children: [
          {
            id: '7-1',
            title: '审批列表',
            path: '/dashboard/approval/process'
          },
          {
            id: '7-2',
            title: '发起审批',
            path: '/dashboard/approval/new'
          },
          {
            id: '7-3',
            title: '审批模板',
            path: '/dashboard/approval/template'
          }
        ]
      },
      {
        id: '8',
        title: '系统管理',
        icon: 'Setting',
        children: [
          {
            id: '8-1',
            title: '用户管理',
            path: '/dashboard/system/users'
          },
          {
            id: '8-2',
            title: '角色管理',
            path: '/dashboard/system/roles'
          },
          {
            id: '8-3',
            title: '权限管理',
            path: '/dashboard/system/permissions'
          },
          {
            id: '8-4',
            title: '系统设置',
            path: '/dashboard/system/settings'
          },
          {
            id: '8-5',
            title: '系统日志',
            path: '/dashboard/system/logs'
          }
        ]
      }
    ]
  }),
  
  getters: {
    getMenuItems: (state) => state.menuItems
  },
  
  actions: {
    // 从路由配置生成菜单
    generateMenuFromRoutes() {
      const dashboardRoute = router.options.routes.find(route => route.path === '/dashboard');
      if (dashboardRoute && dashboardRoute.children) {
        // 这里使用手动定义的菜单，而不是自动生成
        // 如果需要自动生成，可以取消注释下面的代码
        // this.menuItems = generateMenuFromRoutes(dashboardRoute.children);
      }
    },
    
    // 根据用户角色过滤菜单
    filterMenuByRole(role: string) {
      // 实际应用中，这里应该根据用户角色过滤菜单
      // 现在只是一个模拟实现，不做任何过滤
      return this.menuItems;
    },
    
    // 从服务器获取菜单数据
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