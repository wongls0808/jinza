/**
 * 用户相关类型定义
 */
export interface User {
  id: number | string;
  username: string;
  nickname?: string;
  password?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: 0 | 1; // 0-禁用，1-正常
  roles: Role[] | number[]; // 角色ID列表或角色对象列表
  tenants?: Tenant[] | number[]; // 可访问的账套ID列表或账套对象列表
  currentTenant?: number | null; // 当前选择的账套ID
  createTime?: string;
  updateTime?: string;
  lastLoginTime?: string;
  remark?: string;
}

/**
 * 角色相关类型定义
 */
export interface Role {
  id: number | string;
  name: string;
  code: string;
  status: 0 | 1; // 0-禁用，1-正常
  permissions?: Permission[] | number[]; // 权限ID列表或权限对象列表
  menuIds?: number[]; // 可访问的菜单ID列表
  createTime?: string;
  updateTime?: string;
  remark?: string;
}

/**
 * 权限相关类型定义
 */
export interface Permission {
  id: number | string;
  name: string;
  code: string; // 权限编码，如：system:user:add
  type: 'menu' | 'button' | 'api'; // 权限类型
  parentId?: number | string; // 父权限ID
  menuId?: number | string; // 所属菜单ID
  status: 0 | 1; // 0-禁用，1-正常
  createTime?: string;
  updateTime?: string;
  remark?: string;
}

/**
 * 账套相关类型定义
 */
export interface Tenant {
  id: number | string;
  name: string; // 账套名称
  code: string; // 账套编码
  logo?: string; // 账套LOGO
  adminUserId?: number | string; // 管理员用户ID
  status: 0 | 1; // 0-禁用，1-正常
  expireTime?: string; // 过期时间
  maxUserCount?: number; // 最大用户数
  createTime?: string;
  updateTime?: string;
  remark?: string;
  contactName?: string; // 联系人姓名
  contactPhone?: string; // 联系电话
  contactEmail?: string; // 联系邮箱
  address?: string; // 地址
}

/**
 * 用户-账套关联表
 */
export interface UserTenant {
  id: number | string;
  userId: number | string;
  tenantId: number | string;
  roleIds: number[]; // 在该账套下的角色ID列表
  isAdmin: boolean; // 是否是该账套的管理员
  createTime?: string;
  updateTime?: string;
}

/**
 * 菜单相关类型定义
 */
export interface Menu {
  id: number | string;
  name: string; // 菜单名称
  path?: string; // 路由路径
  component?: string; // 组件路径
  redirect?: string; // 重定向路径
  icon?: string; // 图标
  parentId?: number | string | null; // 父菜单ID
  sort: number; // 排序
  type: 'directory' | 'menu' | 'button'; // 类型：目录、菜单、按钮
  perms?: string; // 权限标识
  visible: boolean; // 是否显示
  status: 0 | 1; // 0-禁用，1-正常
  isFrame: boolean; // 是否外链
  createTime?: string;
  updateTime?: string;
  children?: Menu[]; // 子菜单
}

/**
 * 登录表单类型定义
 */
export interface LoginForm {
  username: string;
  password: string;
  tenantId?: number | string; // 账套ID
  remember?: boolean; // 记住密码
  captcha?: string; // 验证码
}

/**
 * 登录响应类型定义
 */
export interface LoginResponse {
  token: string;
  user: User;
  tenant?: Tenant;
  permissions?: string[]; // 权限列表
  roles?: string[]; // 角色列表
  tenants?: Tenant[]; // 可访问的账套列表
}