/**
 * 用户模型
 */

// 模拟数据，实际项目中应该连接数据库
let users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    nickname: '管理员',
    email: 'admin@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    role: 'admin',
    department: 1, // 管理部
    position: 'CEO',
    phone: '13988888888',
    status: 1,
    lastLoginTime: '2025-09-26 08:30:00',
    permissions: ['*'] // 超级管理员拥有所有权限
  },
  {
    id: 2,
    username: 'manager',
    password: 'manager123',
    nickname: '部门经理',
    email: 'manager@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
    role: 'manager',
    department: 2, // 人事部
    position: '人事经理',
    phone: '13900001111',
    status: 1,
    lastLoginTime: '2025-09-25 17:30:00',
    permissions: [
      'employee:view', 'employee:add', 'employee:edit', 
      'department:view', 'department:add', 'department:edit'
    ]
  },
  {
    id: 3,
    username: 'employee',
    password: 'employee123',
    nickname: '普通员工',
    email: 'employee@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/3?v=4',
    role: 'employee',
    department: 4, // 技术部
    position: '工程师',
    phone: '13922223333',
    status: 1,
    lastLoginTime: '2025-09-26 09:15:00',
    permissions: ['employee:view', 'department:view']
  }
];

/**
 * 根据用户名查找用户
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} - 用户对象或null
 */
const findByUsername = async (username) => {
  return users.find(u => u.username === username) || null;
};

/**
 * 根据ID查找用户
 * @param {number} id - 用户ID
 * @returns {Promise<Object|null>} - 用户对象或null
 */
const findById = async (id) => {
  return users.find(u => u.id === id) || null;
};

/**
 * 获取所有用户
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Array>} - 用户数组
 */
const findAll = async (filters = {}) => {
  let result = [...users];
  
  // 应用过滤条件
  if (filters.username) {
    result = result.filter(u => u.username.includes(filters.username));
  }
  
  if (filters.role) {
    result = result.filter(u => u.role === filters.role);
  }
  
  if (filters.department) {
    result = result.filter(u => u.department === parseInt(filters.department));
  }
  
  if (filters.status !== undefined) {
    result = result.filter(u => u.status === parseInt(filters.status));
  }
  
  // 不返回密码
  return result.map(u => {
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
};

/**
 * 创建新用户
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>} - 创建的用户对象
 */
const create = async (userData) => {
  // 验证用户名是否已存在
  const existingUser = await findByUsername(userData.username);
  if (existingUser) {
    throw new Error('用户名已存在');
  }
  
  // 生成新ID
  const newId = Math.max(...users.map(u => u.id)) + 1;
  
  // 创建新用户
  const newUser = {
    id: newId,
    ...userData,
    status: userData.status || 1,
    lastLoginTime: null
  };
  
  users.push(newUser);
  
  // 不返回密码
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

/**
 * 更新用户
 * @param {number} id - 用户ID
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object|null>} - 更新后的用户对象或null
 */
const update = async (id, userData) => {
  const index = users.findIndex(u => u.id === parseInt(id));
  
  if (index === -1) {
    return null;
  }
  
  // 如果要更新用户名，检查是否与其他用户冲突
  if (userData.username && userData.username !== users[index].username) {
    const existingUser = await findByUsername(userData.username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }
  }
  
  // 更新用户数据
  users[index] = {
    ...users[index],
    ...userData
  };
  
  // 不返回密码
  const { password, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
};

/**
 * 删除用户
 * @param {number} id - 用户ID
 * @returns {Promise<boolean>} - 是否成功删除
 */
const remove = async (id) => {
  const index = users.findIndex(u => u.id === parseInt(id));
  
  if (index === -1) {
    return false;
  }
  
  users.splice(index, 1);
  return true;
};

/**
 * 更新用户最后登录时间
 * @param {number} id - 用户ID
 * @returns {Promise<void>}
 */
const updateLastLoginTime = async (id) => {
  const index = users.findIndex(u => u.id === parseInt(id));
  
  if (index !== -1) {
    users[index].lastLoginTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
  }
};

module.exports = {
  findByUsername,
  findById,
  findAll,
  create,
  update,
  remove,
  updateLastLoginTime
};