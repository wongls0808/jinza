/**
 * 权限模型
 */

// 系统权限定义
const permissions = [
  // 员工管理权限
  {
    id: 1,
    code: 'employee:view',
    name: '查看员工',
    description: '查看员工列表和详情',
    type: 'employee',
    status: 1
  },
  {
    id: 2,
    code: 'employee:add',
    name: '新增员工',
    description: '添加新员工信息',
    type: 'employee',
    status: 1
  },
  {
    id: 3,
    code: 'employee:edit',
    name: '编辑员工',
    description: '修改员工信息',
    type: 'employee',
    status: 1
  },
  {
    id: 4,
    code: 'employee:delete',
    name: '删除员工',
    description: '删除员工记录',
    type: 'employee',
    status: 1
  },
  
  // 部门管理权限
  {
    id: 5,
    code: 'department:view',
    name: '查看部门',
    description: '查看部门列表和详情',
    type: 'department',
    status: 1
  },
  {
    id: 6,
    code: 'department:add',
    name: '新增部门',
    description: '添加新部门',
    type: 'department',
    status: 1
  },
  {
    id: 7,
    code: 'department:edit',
    name: '编辑部门',
    description: '修改部门信息',
    type: 'department',
    status: 1
  },
  {
    id: 8,
    code: 'department:delete',
    name: '删除部门',
    description: '删除部门记录',
    type: 'department',
    status: 1
  },
  
  // 财务管理权限
  {
    id: 9,
    code: 'finance:view',
    name: '查看财务',
    description: '查看财务报表和数据',
    type: 'finance',
    status: 1
  },
  {
    id: 10,
    code: 'finance:add',
    name: '新增财务记录',
    description: '添加新财务记录',
    type: 'finance',
    status: 1
  },
  {
    id: 11,
    code: 'finance:edit',
    name: '编辑财务记录',
    description: '修改财务记录',
    type: 'finance',
    status: 1
  },
  {
    id: 12,
    code: 'finance:delete',
    name: '删除财务记录',
    description: '删除财务记录',
    type: 'finance',
    status: 1
  },
  
  // 发票管理权限
  {
    id: 13,
    code: 'invoice:view',
    name: '查看发票',
    description: '查看发票列表和详情',
    type: 'invoice',
    status: 1
  },
  {
    id: 14,
    code: 'invoice:add',
    name: '新增发票',
    description: '添加新发票',
    type: 'invoice',
    status: 1
  },
  {
    id: 15,
    code: 'invoice:edit',
    name: '编辑发票',
    description: '修改发票信息',
    type: 'invoice',
    status: 1
  },
  {
    id: 16,
    code: 'invoice:delete',
    name: '删除发票',
    description: '删除发票记录',
    type: 'invoice',
    status: 1
  },
  
  // 费用管理权限
  {
    id: 17,
    code: 'expense:view',
    name: '查看费用',
    description: '查看费用列表和详情',
    type: 'expense',
    status: 1
  },
  {
    id: 18,
    code: 'expense:add',
    name: '新增费用',
    description: '添加新费用',
    type: 'expense',
    status: 1
  },
  {
    id: 19,
    code: 'expense:edit',
    name: '编辑费用',
    description: '修改费用信息',
    type: 'expense',
    status: 1
  },
  {
    id: 20,
    code: 'expense:delete',
    name: '删除费用',
    description: '删除费用记录',
    type: 'expense',
    status: 1
  },
  
  // 工资管理权限
  {
    id: 21,
    code: 'salary:view',
    name: '查看工资',
    description: '查看工资列表和详情',
    type: 'salary',
    status: 1
  },
  {
    id: 22,
    code: 'salary:add',
    name: '新增工资',
    description: '添加新工资记录',
    type: 'salary',
    status: 1
  },
  {
    id: 23,
    code: 'salary:edit',
    name: '编辑工资',
    description: '修改工资信息',
    type: 'salary',
    status: 1
  },
  
  // 考勤管理权限
  {
    id: 24,
    code: 'attendance:view',
    name: '查看考勤',
    description: '查看考勤记录',
    type: 'attendance',
    status: 1
  },
  {
    id: 25,
    code: 'attendance:add',
    name: '新增考勤',
    description: '添加考勤记录',
    type: 'attendance',
    status: 1
  },
  {
    id: 26,
    code: 'attendance:edit',
    name: '编辑考勤',
    description: '修改考勤记录',
    type: 'attendance',
    status: 1
  },
  
  // 项目管理权限
  {
    id: 27,
    code: 'project:view',
    name: '查看项目',
    description: '查看项目列表和详情',
    type: 'project',
    status: 1
  },
  {
    id: 28,
    code: 'project:add',
    name: '新增项目',
    description: '添加新项目',
    type: 'project',
    status: 1
  },
  {
    id: 29,
    code: 'project:edit',
    name: '编辑项目',
    description: '修改项目信息',
    type: 'project',
    status: 1
  },
  {
    id: 30,
    code: 'project:delete',
    name: '删除项目',
    description: '删除项目记录',
    type: 'project',
    status: 1
  },
  
  // 任务管理权限
  {
    id: 31,
    code: 'task:view',
    name: '查看任务',
    description: '查看任务列表和详情',
    type: 'task',
    status: 1
  },
  {
    id: 32,
    code: 'task:add',
    name: '新增任务',
    description: '添加新任务',
    type: 'task',
    status: 1
  },
  {
    id: 33,
    code: 'task:edit',
    name: '编辑任务',
    description: '修改任务信息',
    type: 'task',
    status: 1
  },
  {
    id: 34,
    code: 'task:delete',
    name: '删除任务',
    description: '删除任务记录',
    type: 'task',
    status: 1
  },
  
  // 系统管理权限
  {
    id: 35,
    code: 'system:view',
    name: '查看系统',
    description: '查看系统设置',
    type: 'system',
    status: 1
  },
  {
    id: 36,
    code: 'system:edit',
    name: '编辑系统',
    description: '修改系统设置',
    type: 'system',
    status: 1
  },
  {
    id: 37,
    code: 'system:user',
    name: '用户管理',
    description: '管理系统用户',
    type: 'system',
    status: 1
  },
  {
    id: 38,
    code: 'system:role',
    name: '角色管理',
    description: '管理系统角色',
    type: 'system',
    status: 1
  },
  {
    id: 39,
    code: 'system:permission',
    name: '权限管理',
    description: '管理系统权限',
    type: 'system',
    status: 1
  },
  {
    id: 40,
    code: 'system:log',
    name: '日志查看',
    description: '查看系统日志',
    type: 'system',
    status: 1
  }
];

/**
 * 获取所有权限
 * @returns {Promise<Array>} - 权限数组
 */
const getAllPermissions = async () => {
  return [...permissions];
};

/**
 * 根据类型获取权限
 * @param {string} type - 权限类型
 * @returns {Promise<Array>} - 权限数组
 */
const getPermissionsByType = async (type) => {
  return permissions.filter(p => p.type === type);
};

/**
 * 根据代码获取权限
 * @param {string} code - 权限代码
 * @returns {Promise<Object|null>} - 权限对象或null
 */
const getPermissionByCode = async (code) => {
  return permissions.find(p => p.code === code) || null;
};

/**
 * 验证权限是否有效
 * @param {string} code - 权限代码
 * @returns {Promise<boolean>} - 权限是否有效
 */
const isValidPermission = async (code) => {
  // 超级管理员权限
  if (code === '*') {
    return true;
  }
  
  return !!await getPermissionByCode(code);
};

module.exports = {
  getAllPermissions,
  getPermissionsByType,
  getPermissionByCode,
  isValidPermission
};