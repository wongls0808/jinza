/**
 * 角色模型
 */

// 角色定义
const roles = [
  {
    id: 1,
    code: 'admin',
    name: '超级管理员',
    description: '系统超级管理员，拥有所有权限',
    status: 1
  },
  {
    id: 2,
    code: 'manager',
    name: '部门经理',
    description: '部门管理者，拥有部门内的管理权限',
    status: 1
  },
  {
    id: 3,
    code: 'employee',
    name: '普通员工',
    description: '普通员工，拥有基本操作权限',
    status: 1
  },
  {
    id: 4,
    code: 'finance',
    name: '财务人员',
    description: '财务部门人员，拥有财务相关权限',
    status: 1
  },
  {
    id: 5,
    code: 'hr',
    name: '人力资源',
    description: '人力资源部门人员，拥有人事相关权限',
    status: 1
  }
];

// 角色权限映射
const rolePermissions = {
  'admin': ['*'], // 超级管理员拥有所有权限
  'manager': [
    // 部门和员工管理权限
    'department:view', 'department:add', 'department:edit', 'department:delete',
    'employee:view', 'employee:add', 'employee:edit', 'employee:delete',
    // 项目管理权限
    'project:view', 'project:add', 'project:edit', 'project:delete',
    'task:view', 'task:add', 'task:edit', 'task:delete',
    // 系统设置权限（部分）
    'system:view'
  ],
  'employee': [
    // 基础查看权限
    'department:view',
    'employee:view',
    'project:view',
    'task:view'
  ],
  'finance': [
    // 财务权限
    'finance:view', 'finance:add', 'finance:edit', 'finance:delete',
    'invoice:view', 'invoice:add', 'invoice:edit', 'invoice:delete',
    'expense:view', 'expense:add', 'expense:edit', 'expense:delete',
    'salary:view', 'salary:add', 'salary:edit',
    // 基础查看权限
    'department:view',
    'employee:view'
  ],
  'hr': [
    // 人力资源权限
    'department:view', 'department:add', 'department:edit',
    'employee:view', 'employee:add', 'employee:edit', 'employee:delete',
    'attendance:view', 'attendance:add', 'attendance:edit',
    'salary:view', 'salary:add', 'salary:edit',
    // 基础查看权限
    'project:view'
  ]
};

/**
 * 获取所有角色
 * @returns {Promise<Array>} - 角色数组
 */
const getAllRoles = async () => {
  return [...roles];
};

/**
 * 根据ID查找角色
 * @param {number} id - 角色ID
 * @returns {Promise<Object|null>} - 角色对象或null
 */
const findRoleById = async (id) => {
  return roles.find(r => r.id === parseInt(id)) || null;
};

/**
 * 根据代码查找角色
 * @param {string} code - 角色代码
 * @returns {Promise<Object|null>} - 角色对象或null
 */
const findRoleByCode = async (code) => {
  return roles.find(r => r.code === code) || null;
};

/**
 * 创建新角色
 * @param {Object} roleData - 角色数据
 * @returns {Promise<Object>} - 创建的角色对象
 */
const createRole = async (roleData) => {
  // 验证角色代码是否已存在
  const existingRole = await findRoleByCode(roleData.code);
  if (existingRole) {
    throw new Error('角色代码已存在');
  }
  
  // 生成新ID
  const newId = Math.max(...roles.map(r => r.id)) + 1;
  
  // 创建新角色
  const newRole = {
    id: newId,
    ...roleData,
    status: roleData.status || 1
  };
  
  roles.push(newRole);
  return newRole;
};

/**
 * 更新角色
 * @param {number} id - 角色ID
 * @param {Object} roleData - 角色数据
 * @returns {Promise<Object|null>} - 更新后的角色对象或null
 */
const updateRole = async (id, roleData) => {
  const index = roles.findIndex(r => r.id === parseInt(id));
  
  if (index === -1) {
    return null;
  }
  
  // 如果要更新角色代码，检查是否与其他角色冲突
  if (roleData.code && roleData.code !== roles[index].code) {
    const existingRole = await findRoleByCode(roleData.code);
    if (existingRole) {
      throw new Error('角色代码已存在');
    }
  }
  
  // 更新角色数据
  roles[index] = {
    ...roles[index],
    ...roleData
  };
  
  return roles[index];
};

/**
 * 删除角色
 * @param {number} id - 角色ID
 * @returns {Promise<boolean>} - 是否成功删除
 */
const deleteRole = async (id) => {
  const index = roles.findIndex(r => r.id === parseInt(id));
  
  if (index === -1) {
    return false;
  }
  
  // 不允许删除系统预设角色
  if ([1, 2, 3, 4, 5].includes(roles[index].id)) {
    throw new Error('不能删除系统预设角色');
  }
  
  roles.splice(index, 1);
  return true;
};

/**
 * 获取角色权限
 * @param {string} roleCode - 角色代码
 * @returns {Promise<Array>} - 权限数组
 */
const getRolePermissions = async (roleCode) => {
  return rolePermissions[roleCode] || [];
};

/**
 * 更新角色权限
 * @param {string} roleCode - 角色代码
 * @param {Array} permissions - 权限数组
 * @returns {Promise<Array>} - 更新后的权限数组
 */
const updateRolePermissions = async (roleCode, permissions) => {
  // 不允许修改管理员权限
  if (roleCode === 'admin') {
    throw new Error('不能修改超级管理员权限');
  }
  
  // 检查角色是否存在
  const role = await findRoleByCode(roleCode);
  if (!role) {
    throw new Error('角色不存在');
  }
  
  // 更新权限
  rolePermissions[roleCode] = [...permissions];
  
  return rolePermissions[roleCode];
};

module.exports = {
  getAllRoles,
  findRoleById,
  findRoleByCode,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions
};