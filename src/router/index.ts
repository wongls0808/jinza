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
    redirect: '/dashboard/index',
    meta: {
      title: '企业管理系统',
      requireAuth: true,
    },
    children: [
      // 首页仪表盘
      {
        path: 'index',
        name: 'DashboardIndex',
        component: () => import('@/views/Home.vue'),
        meta: {
          title: '管理仪表盘',
          requireAuth: true,
          icon: 'HomeFilled',
        }
      },
      
      // 人力资源管理模块
      {
        path: 'hr',
        name: 'HR',
        component: () => import('@/views/EmptyRouter.vue'),
        meta: {
          title: '人力资源',
          requireAuth: true,
          icon: 'User',
        },
        children: [
          {
            path: 'employee',
            name: 'EmployeeManagement',
            component: () => import('@/views/hr/EmployeeList.vue'),
            meta: {
              title: '员工管理',
              requireAuth: true,
            }
          },
          {
            path: 'employee/add',
            name: 'AddEmployee',
            component: () => import('@/views/hr/EmployeeForm.vue'),
            meta: {
              title: '新增员工',
              requireAuth: true,
              hidden: true,
            }
          },
          {
            path: 'employee/edit/:id',
            name: 'EditEmployee',
            component: () => import('@/views/hr/EmployeeForm.vue'),
            meta: {
              title: '编辑员工',
              requireAuth: true,
              hidden: true,
            }
          },
          {
            path: 'department',
            name: 'DepartmentManagement',
            component: () => import('@/views/hr/DepartmentList.vue'),
            meta: {
              title: '部门管理',
              requireAuth: true,
            }
          },
          {
            path: 'attendance',
            name: 'AttendanceManagement',
            component: () => import('@/views/hr/Attendance.vue'),
            meta: {
              title: '考勤管理',
              requireAuth: true,
            }
          }
        ]
      },
      
      // 财务管理模块
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/EmptyRouter.vue'),
        meta: {
          title: '财务管理',
          requireAuth: true,
          icon: 'Money',
        },
        children: [
          {
            path: 'invoice',
            name: 'InvoiceManagement',
            component: () => import('@/views/finance/InvoiceList.vue'),
            meta: {
              title: '发票管理',
              requireAuth: true,
            }
          },
          {
            path: 'expense',
            name: 'ExpenseManagement',
            component: () => import('@/views/finance/ExpenseList.vue'),
            meta: {
              title: '费用管理',
              requireAuth: true,
            }
          },
          {
            path: 'salary',
            name: 'SalaryManagement',
            component: () => import('@/views/finance/SalaryList.vue'),
            meta: {
              title: '工资管理',
              requireAuth: true,
            }
          },
          {
            path: 'reports',
            name: 'FinancialReports',
            component: () => import('@/views/finance/FinancialReports.vue'),
            meta: {
              title: '财务报表',
              requireAuth: true,
            }
          }
        ]
      },
      
      // 库存管理模块
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/EmptyRouter.vue'),
        meta: {
          title: '库存管理',
          requireAuth: true,
          icon: 'Box',
        },
        children: [
          {
            path: 'product',
            name: 'ProductManagement',
            component: () => import('@/views/inventory/ProductList.vue'),
            meta: {
              title: '产品管理',
              requireAuth: true,
            }
          },
          {
            path: 'stock',
            name: 'StockManagement',
            component: () => import('@/views/inventory/StockList.vue'),
            meta: {
              title: '库存状态',
              requireAuth: true,
            }
          },
          {
            path: 'purchase',
            name: 'PurchaseManagement',
            component: () => import('@/views/inventory/PurchaseList.vue'),
            meta: {
              title: '采购管理',
              requireAuth: true,
            }
          }
        ]
      },
      
      // 项目管理模块
      {
        path: 'project',
        name: 'Project',
        component: () => import('@/views/EmptyRouter.vue'),
        meta: {
          title: '项目管理',
          requireAuth: true,
          icon: 'Briefcase',
        },
        children: [
          {
            path: 'list',
            name: 'ProjectList',
            component: () => import('@/views/project/ProjectList.vue'),
            meta: {
              title: '项目列表',
              requireAuth: true,
            }
          },
          {
            path: 'detail/:id',
            name: 'ProjectDetail',
            component: () => import('@/views/project/ProjectDetail.vue'),
            meta: {
              title: '项目详情',
              requireAuth: true,
              hidden: true,
            }
          },
          {
            path: 'task',
            name: 'TaskManagement',
            component: () => import('@/views/project/TaskList.vue'),
            meta: {
              title: '任务管理',
              requireAuth: true,
            }
          }
        ]
      },
      
      // 客户关系管理模块
      {
        path: 'crm',
        name: 'CRM',
        component: () => import('@/views/EmptyRouter.vue'),
        meta: {
          title: '客户管理',
          requireAuth: true,
          icon: 'Service',
        },
        children: [
          {
            path: 'customer',
            name: 'CustomerManagement',
            component: () => import('@/views/crm/CustomerList.vue'),
            meta: {
              title: '客户列表',
              requireAuth: true,
            }
          },
          {
            path: 'contact',
            name: 'ContactManagement',
            component: () => import('@/views/crm/ContactList.vue'),
            meta: {
              title: '联系人管理',
              requireAuth: true,
            }
          },
          {
            path: 'opportunity',
            name: 'OpportunityManagement',
            component: () => import('@/views/crm/OpportunityList.vue'),
            meta: {
              title: '商机管理',
              requireAuth: true,
            }
          },
          {
            path: 'contract',
            name: 'ContractManagement',
            component: () => import('@/views/crm/ContractList.vue'),
            meta: {
              title: '合同管理',
              requireAuth: true,
            }
          }
        ]
      },
      
      // 审批流程模块
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('@/views/EmptyRouter.vue'),
        meta: {
          title: '审批流程',
          requireAuth: true,
          icon: 'DocumentChecked',
        },
        children: [
          {
            path: 'process',
            name: 'ApprovalProcess',
            component: () => import('@/views/approval/ApprovalList.vue'),
            meta: {
              title: '审批列表',
              requireAuth: true,
            }
          },
          {
            path: 'new',
            name: 'NewApproval',
            component: () => import('@/views/approval/ApprovalForm.vue'),
            meta: {
              title: '发起审批',
              requireAuth: true,
            }
          },
          {
            path: 'template',
            name: 'ApprovalTemplate',
            component: () => import('@/views/approval/TemplateList.vue'),
            meta: {
              title: '审批模板',
              requireAuth: true,
            }
          }
        ]
      },
      
      // 系统管理模块
      {
        path: 'system',
        name: 'System',
        component: () => import('@/views/EmptyRouter.vue'),
        meta: {
          title: '系统管理',
          requireAuth: true,
          icon: 'Setting',
        },
        children: [
          {
            path: 'users',
            name: 'UserManagement',
            component: () => import('@/views/system/Users.vue'),
            meta: {
              title: '用户管理',
              requireAuth: true,
            }
          },
          {
            path: 'roles',
            name: 'RoleManagement',
            component: () => import('@/views/system/Roles.vue'),
            meta: {
              title: '角色管理',
              requireAuth: true,
            }
          },
          {
            path: 'permissions',
            name: 'PermissionManagement',
            component: () => import('@/views/system/Permissions.vue'),
            meta: {
              title: '权限管理',
              requireAuth: true,
            }
          },
          {
            path: 'settings',
            name: 'SystemSettings',
            component: () => import('@/views/system/Settings.vue'),
            meta: {
              title: '系统设置',
              requireAuth: true,
            }
          },
          {
            path: 'logs',
            name: 'SystemLogs',
            component: () => import('@/views/system/Logs.vue'),
            meta: {
              title: '系统日志',
              requireAuth: true,
            }
          }
        ]
      }
    ]
  },
  {
    path: '/deployment-test',
    name: 'DeploymentTest',
    component: () => import('@/views/DeploymentTest.vue'),
    meta: {
      title: '部署测试',
      requireAuth: false,
    }
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