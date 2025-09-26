import { defineStore } from 'pinia';
import { ref } from 'vue';
import router from '@/router';
import type { User, Tenant, LoginForm, LoginResponse } from '@/types/system';

// 模拟API登录
const login = async (loginForm: LoginForm): Promise<LoginResponse> => {
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 模拟用户列表
  const users: User[] = [
    {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      password: '123456',
      status: 1,
      roles: [1], // 超级管理员角色
      tenants: [1, 2],
      currentTenant: null,
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    },
    {
      id: 2,
      username: 'test',
      nickname: '测试用户',
      password: '123456',
      status: 1,
      roles: [2], // 普通用户角色
      tenants: [1],
      currentTenant: null,
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  ];

  // 模拟租户列表
  const tenants: Tenant[] = [
    {
      id: 1,
      name: '示例公司1',
      code: 'company1',
      status: 1,
      adminUserId: 1
    },
    {
      id: 2,
      name: '示例公司2',
      code: 'company2',
      status: 1,
      adminUserId: 1
    }
  ];

  // 模拟登录验证
  const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
  if (!user) {
    throw new Error('用户名或密码错误');
  }
  
  if (user.status === 0) {
    throw new Error('用户已禁用');
  }

  // 如果传入了租户ID，验证用户是否有权限访问该租户
  if (loginForm.tenantId) {
    // 检查用户是否有权限访问该租户
    const tenantId = Number(loginForm.tenantId);
    const hasTenant = Array.isArray(user.tenants) && 
      user.tenants.some(t => typeof t === 'number' ? t === tenantId : t.id === tenantId);
      
    if (!hasTenant) {
      throw new Error('您没有访问该账套的权限');
    }
    user.currentTenant = tenantId;
  }

  // 过滤用户有权限的租户
  const userTenants = tenants.filter(t => {
    // @ts-ignore
    return user.tenants?.includes(t.id);
  });

  // 模拟返回token和用户信息
  const permissions = user.id === 1 
    ? ['system:user:list', 'system:user:add', 'system:user:edit', 'system:user:delete', 'system:tenant:list', 'system:tenant:add', 'system:tenant:edit', 'system:tenant:delete']
    : ['system:user:list'];
  const roles = user.id === 1 ? ['admin'] : ['user'];

  return {
    token: 'mock-token-' + user.id,
    user: { ...user, password: undefined },
    tenants: userTenants,
    permissions,
    roles
  };
};

// 获取用户信息API模拟
const getUserInfo = async (token: string): Promise<LoginResponse> => {
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 根据token判断用户
  if (!token) {
    throw new Error('无效的token');
  }

  // 模拟返回用户信息
  if (token.includes('1')) {
    return {
      token,
      user: {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        status: 1,
        roles: [1],
        tenants: [1, 2],
        currentTenant: null,
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      },
      tenants: [
        {
          id: 1,
          name: '示例公司1',
          code: 'company1',
          status: 1
        },
        {
          id: 2,
          name: '示例公司2',
          code: 'company2',
          status: 1
        }
      ],
      permissions: ['system:user:list', 'system:user:add', 'system:user:edit', 'system:user:delete', 'system:tenant:list', 'system:tenant:add', 'system:tenant:edit', 'system:tenant:delete'],
      roles: ['admin']
    };
  } else {
    return {
      token,
      user: {
        id: 2,
        username: 'test',
        nickname: '测试用户',
        status: 1,
        roles: [2],
        tenants: [1],
        currentTenant: null,
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      },
      tenants: [
        {
          id: 1,
          name: '示例公司1',
          code: 'company1',
          status: 1
        }
      ],
      permissions: ['system:user:list'],
      roles: ['user']
    };
  }
};

// 退出登录API模拟
const logout = async (): Promise<void> => {
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
};

// 切换账套API模拟
const switchTenant = async (tenantId: number): Promise<void> => {
  // 模拟API请求延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  return Promise.resolve();
};

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const user = ref<User | null>(null);
  const tenants = ref<Tenant[]>([]);
  const permissions = ref<string[]>([]);
  const roles = ref<string[]>([]);
  const isLoggedIn = ref(!!token.value);

  /**
   * 登录
   * @param loginForm 登录表单数据
   */
  const loginAction = async (loginForm: LoginForm) => {
    try {
      const res = await login(loginForm);
      token.value = res.token;
      user.value = res.user;
      tenants.value = res.tenants || [];
      permissions.value = res.permissions || [];
      roles.value = res.roles || [];
      isLoggedIn.value = true;

      // 保存token到localStorage
      localStorage.setItem('token', res.token);

      // 如果没有选择账套，但用户有可用账套，则自动选择第一个
      if (!user.value.currentTenant && tenants.value.length > 0 && tenants.value[0]) {
        const firstTenantId = tenants.value[0].id;
        user.value.currentTenant = typeof firstTenantId === 'string' 
          ? Number(firstTenantId) 
          : firstTenantId;
      }

      return res;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 获取用户信息
   */
  const getUserInfoAction = async () => {
    if (!token.value) {
      throw new Error('无效的token');
    }

    try {
      const res = await getUserInfo(token.value);
      user.value = res.user;
      tenants.value = res.tenants || [];
      permissions.value = res.permissions || [];
      roles.value = res.roles || [];

      // 如果没有选择账套，但用户有可用账套，则自动选择第一个
      if (!user.value.currentTenant && tenants.value.length > 0) {
        const firstTenantId = tenants.value[0].id;
        user.value.currentTenant = typeof firstTenantId === 'string' 
          ? Number(firstTenantId) 
          : firstTenantId;
      }

      isLoggedIn.value = true;
      return res;
    } catch (error) {
      logoutAction();
      throw error;
    }
  };

  /**
   * 退出登录
   */
  const logoutAction = () => {
    // 清空状态
    token.value = '';
    user.value = null;
    tenants.value = [];
    permissions.value = [];
    roles.value = [];
    isLoggedIn.value = false;
    
    // 清空localStorage
    localStorage.removeItem('token');
    
    // 跳转到登录页
    router.push('/login');
  };

  /**
   * 切换账套
   * @param tenantId 账套ID
   */
  const switchTenantAction = async (tenantId: number) => {
    if (!user.value) {
      throw new Error('用户未登录');
    }
    
    // 检查用户是否有该账套的访问权限
    const hasTenant = Array.isArray(user.value.tenants) && 
      user.value.tenants.some(t => (typeof t === 'number' ? t === tenantId : t.id === tenantId));
      
    if (!hasTenant) {
      throw new Error('您没有访问该账套的权限');
    }
    
    try {
      await switchTenant(tenantId);
      user.value.currentTenant = tenantId;
      return true;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 检查是否有权限
   * @param permission 权限标识
   */
  const hasPermission = (permission: string): boolean => {
    // 如果是超级管理员，拥有所有权限
    if (roles.value.includes('admin')) {
      return true;
    }
    
    // 否则检查是否有指定权限
    return permissions.value.includes(permission);
  };

  /**
   * 检查是否有角色
   * @param role 角色标识
   */
  const hasRole = (role: string): boolean => {
    return roles.value.includes(role);
  };
  
  /**
   * 获取当前选择的账套
   */
  const getCurrentTenant = (): Tenant | undefined => {
    if (!user.value?.currentTenant) {
      return undefined;
    }
    return tenants.value.find(t => t.id === user.value?.currentTenant);
  };

  return {
    token,
    user,
    tenants,
    permissions,
    roles,
    isLoggedIn,
    loginAction,
    getUserInfoAction,
    logoutAction,
    switchTenantAction,
    hasPermission,
    hasRole,
    getCurrentTenant
  };
});