import { defineStore } from 'pinia';
import { ref } from 'vue';
import router from '@/router';
import type { User, Tenant, LoginForm, LoginResponse } from '@/types/system';
import * as api from '@/api/userManagement';

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
  const res = await api.login(loginForm);
      token.value = res.token;
      user.value = res.user;
      tenants.value = res.tenants || [];
      permissions.value = res.permissions || [];
      roles.value = res.roles || [];
      isLoggedIn.value = true;

      // 保存token到localStorage
      localStorage.setItem('token', res.token);

      // 如果没有选择账套，但用户有可用账套，则自动选择第一个
      if (user.value && !user.value.currentTenant && tenants.value.length > 0 && tenants.value[0]) {
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
  const res = await api.getUserInfo(token.value);
      user.value = res.user;
      tenants.value = res.tenants || [];
      permissions.value = res.permissions || [];
      roles.value = res.roles || [];

      // 如果没有选择账套，但用户有可用账套，则自动选择第一个
      if (user.value && !user.value.currentTenant && tenants.value.length > 0 && tenants.value[0]) {
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
  await api.switchTenant(tenantId);
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

  // ------- 用户管理（Mock CRUD） -------
  // 本地维护一份模拟用户列表，供 UI 开发使用
  const usersList = ref<User[]>([
    {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      status: 1,
      roles: [1],
      tenants: [1, 2],
      currentTenant: null,
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    },
    {
      id: 2,
      username: 'test',
      nickname: '测试用户',
      status: 1,
      roles: [2],
      tenants: [1],
      currentTenant: null,
      avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  ]);

  const fetchUsers = async (query?: { page?: number; pageSize?: number; keyword?: string }) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    // 简单的过滤示例
    let list = usersList.value.slice();
    if (query?.keyword) {
      const k = query.keyword.toLowerCase();
      list = list.filter(u => (u.username || '').toLowerCase().includes(k) || (u.nickname || '').toLowerCase().includes(k));
    }
    return {
      total: list.length,
      items: list
    };
  };

  const getUserById = async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return usersList.value.find(u => Number(u.id) === Number(id)) || null;
  };

  const createUser = async (payload: Partial<User>) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const maxId = usersList.value.reduce((m, u) => Math.max(m, Number(u.id || 0)), 0);
    const newUser: User = {
      id: maxId + 1,
      username: payload.username || `user${maxId + 1}`,
      nickname: payload.nickname || payload.username || `用户${maxId + 1}`,
      status: typeof payload.status === 'number' ? payload.status : 1,
      roles: payload.roles || [],
      tenants: payload.tenants || [],
      currentTenant: payload.currentTenant || null,
      avatar: payload.avatar || ''
    } as User;
    usersList.value.push(newUser);
    return newUser;
  };

  const updateUser = async (id: number, payload: Partial<User>) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const idx = usersList.value.findIndex(u => Number(u.id) === Number(id));
    if (idx === -1) throw new Error('用户不存在');
    usersList.value[idx] = { ...usersList.value[idx], ...payload } as User;
    return usersList.value[idx];
  };

  const deleteUser = async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const idx = usersList.value.findIndex(u => Number(u.id) === Number(id));
    if (idx === -1) throw new Error('用户不存在');
    usersList.value.splice(idx, 1);
    return true;
  };

  // ------- 角色与权限（Mock） -------
  // 模拟角色列表（id 与 types/system.ts 中 Role 类型对应）
  const rolesList = ref<import('@/types/system').Role[]>([
    { id: 1, name: '管理员', code: 'admin', status: 1, permissions: [1,2,3,4], menuIds: [] },
    { id: 2, name: '用户', code: 'user', status: 1, permissions: [1], menuIds: [] }
  ]);

  // 模拟权限列表
  const permissionsList = ref<import('@/types/system').Permission[]>([
    { id: 1, name: '查看用户', code: 'system:user:list', type: 'api', status: 1 },
    { id: 2, name: '添加用户', code: 'system:user:add', type: 'api', status: 1 },
    { id: 3, name: '编辑用户', code: 'system:user:edit', type: 'api', status: 1 },
    { id: 4, name: '删除用户', code: 'system:user:delete', type: 'api', status: 1 }
  ]);

  const fetchRoles = async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return rolesList.value.slice();
  };

  const getRoleById = async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return rolesList.value.find(r => Number(r.id) === Number(id)) || null;
  };

  const createRole = async (payload: Partial<import('@/types/system').Role>) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const maxId = rolesList.value.reduce((m, r) => Math.max(m, Number(r.id || 0)), 0);
    const newRole: import('@/types/system').Role = {
      id: maxId + 1,
      name: payload.name || `角色${maxId + 1}`,
      code: payload.code || `role_${maxId + 1}`,
      status: typeof payload.status === 'number' ? payload.status : 1,
      permissions: payload.permissions || [],
      menuIds: payload.menuIds || []
    };
    rolesList.value.push(newRole);
    return newRole;
  };

  const updateRole = async (id: number, payload: Partial<import('@/types/system').Role>) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const idx = rolesList.value.findIndex(r => Number(r.id) === Number(id));
    if (idx === -1) throw new Error('角色不存在');
    rolesList.value[idx] = { ...rolesList.value[idx], ...payload } as import('@/types/system').Role;
    return rolesList.value[idx];
  };

  const deleteRole = async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const idx = rolesList.value.findIndex(r => Number(r.id) === Number(id));
    if (idx === -1) throw new Error('角色不存在');
    rolesList.value.splice(idx, 1);
    return true;
  };

  // 给用户分配角色（覆盖式分配）
  const assignRolesToUser = async (userId: number, roleIds: number[]) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const idx = usersList.value.findIndex(u => Number(u.id) === Number(userId));
    if (idx === -1) throw new Error('用户不存在');
    const targetUser = usersList.value[idx];
    if (!targetUser) throw new Error('用户不存在');
    targetUser.roles = roleIds.slice();
    // 如果正在登录的用户被修改，保持同步
    if (user.value && Number(user.value.id) === Number(userId)) {
      user.value.roles = roleIds.slice();
      // 根据角色更新权限（简单聚合权限 codes）
      const aggregated: string[] = [];
      roleIds.forEach(rid => {
        const role = rolesList.value.find(rr => Number(rr.id) === Number(rid));
        if (role && Array.isArray(role.permissions)) {
          role.permissions.forEach(pid => {
            const perm = permissionsList.value.find(pp => Number(pp.id) === Number(pid));
            if (perm && perm.code && !aggregated.includes(perm.code)) aggregated.push(perm.code);
          });
        }
      });
      permissions.value = aggregated;
    }
    return usersList.value[idx];
  };

  const fetchPermissions = async () => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return permissionsList.value.slice();
  };

  const getPermissionById = async (id: number) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return permissionsList.value.find(p => Number(p.id) === Number(id)) || null;
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
    ,
    // 用户管理 API
    usersList,
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
    ,
    // 角色/权限 API
    rolesList,
    permissionsList,
    fetchRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    assignRolesToUser,
    fetchPermissions,
    getPermissionById
  };
});