/**
 * 菜单模型
 */
const mongoose = require('mongoose');

// 定义菜单Schema
const menuSchema = new mongoose.Schema({
  // 菜单名称
  name: { 
    type: String, 
    required: true 
  },
  // 菜单路径
  path: { 
    type: String, 
    required: true,
    unique: true
  },
  // 组件路径
  component: { 
    type: String 
  },
  // 重定向地址
  redirect: { 
    type: String 
  },
  // 菜单图标
  icon: { 
    type: String 
  },
  // 父级菜单ID
  parentId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    default: null
  },
  // 排序号
  orderNum: { 
    type: Number, 
    default: 0 
  },
  // 是否隐藏
  hidden: { 
    type: Boolean, 
    default: false 
  },
  // 是否缓存
  keepAlive: { 
    type: Boolean, 
    default: false 
  },
  // 是否外链
  external: { 
    type: Boolean, 
    default: false 
  },
  // 菜单类型 (1:目录 2:菜单 3:按钮)
  type: { 
    type: Number,
    enum: [1, 2, 3],
    default: 2
  },
  // 权限标识
  permission: { 
    type: String 
  },
  // 创建时间
  createTime: { 
    type: Date, 
    default: Date.now 
  },
  // 更新时间
  updateTime: { 
    type: Date, 
    default: Date.now 
  }
});

// 创建索引
menuSchema.index({ path: 1 }, { unique: true });
menuSchema.index({ parentId: 1 });
menuSchema.index({ orderNum: 1 });
menuSchema.index({ type: 1 });

// 创建模型
const Menu = mongoose.model('Menu', menuSchema);

/**
 * 获取所有菜单
 * @returns {Promise} - 菜单列表
 */
const getAllMenus = async () => {
  return await Menu.find().sort({ orderNum: 1 });
};

/**
 * 获取菜单树
 * @returns {Promise} - 菜单树
 */
const getMenuTree = async () => {
  const menus = await Menu.find().sort({ orderNum: 1 });
  
  // 构建菜单树
  return buildMenuTree(menus);
};

/**
 * 构建菜单树
 * @param {Array} menus - 菜单列表
 * @param {String} parentId - 父级ID
 * @returns {Array} - 菜单树
 */
const buildMenuTree = (menus, parentId = null) => {
  const result = [];
  
  for (const menu of menus) {
    // 字符串比较，因为ObjectId需要转换
    const menuParentId = menu.parentId ? menu.parentId.toString() : null;
    const compareId = parentId ? parentId.toString() : null;
    
    if (menuParentId === compareId) {
      const node = menu.toObject();
      
      // 递归查找子菜单
      const children = buildMenuTree(menus, menu._id);
      if (children.length > 0) {
        node.children = children;
      }
      
      result.push(node);
    }
  }
  
  return result;
};

/**
 * 根据ID查找菜单
 * @param {Number} id - 菜单ID
 * @returns {Promise} - 菜单对象
 */
const findMenuById = async (id) => {
  return await Menu.findById(id);
};

/**
 * 创建菜单
 * @param {Object} menuData - 菜单数据
 * @returns {Promise} - 创建的菜单对象
 */
const createMenu = async (menuData) => {
  // 检查路径是否唯一
  const existing = await Menu.findOne({ path: menuData.path });
  if (existing) {
    const error = new Error('菜单路径已存在');
    error.status = 409;
    throw error;
  }
  
  // 转换parentId为ObjectId
  if (menuData.parentId && typeof menuData.parentId === 'string') {
    try {
      menuData.parentId = mongoose.Types.ObjectId(menuData.parentId);
    } catch (error) {
      menuData.parentId = null;
    }
  }
  
  const menu = new Menu(menuData);
  return await menu.save();
};

/**
 * 更新菜单
 * @param {Number} id - 菜单ID
 * @param {Object} menuData - 菜单数据
 * @returns {Promise} - 更新后的菜单对象
 */
const updateMenu = async (id, menuData) => {
  // 检查菜单是否存在
  const menu = await Menu.findById(id);
  if (!menu) {
    return null;
  }
  
  // 检查路径是否唯一
  if (menuData.path && menuData.path !== menu.path) {
    const existing = await Menu.findOne({ path: menuData.path });
    if (existing) {
      const error = new Error('菜单路径已存在');
      error.status = 409;
      throw error;
    }
  }
  
  // 转换parentId为ObjectId
  if (menuData.parentId && typeof menuData.parentId === 'string') {
    try {
      menuData.parentId = mongoose.Types.ObjectId(menuData.parentId);
    } catch (error) {
      menuData.parentId = null;
    }
  }
  
  // 设置更新时间
  menuData.updateTime = new Date();
  
  return await Menu.findByIdAndUpdate(id, menuData, { new: true });
};

/**
 * 删除菜单
 * @param {Number} id - 菜单ID
 * @returns {Promise} - 操作结果
 */
const deleteMenu = async (id) => {
  const result = await Menu.deleteOne({ _id: id });
  return result.deletedCount > 0;
};

/**
 * 检查是否有子菜单
 * @param {Number} id - 菜单ID
 * @returns {Promise} - 是否有子菜单
 */
const hasChildMenus = async (id) => {
  const count = await Menu.countDocuments({ parentId: id });
  return count > 0;
};

/**
 * 根据角色ID获取菜单列表
 * @param {Number} roleId - 角色ID
 * @returns {Promise} - 菜单列表
 */
const getMenusByRoleId = async (roleId) => {
  // 导入角色菜单关联模型
  const RoleMenu = mongoose.model('RoleMenu');
  
  // 查询角色菜单关联
  const roleMenus = await RoleMenu.find({ roleId });
  
  // 提取菜单ID
  const menuIds = roleMenus.map(rm => rm.menuId);
  
  // 查询菜单
  const menus = await Menu.find({ _id: { $in: menuIds } }).sort({ orderNum: 1 });
  
  // 构建菜单树
  return buildMenuTree(menus);
};

/**
 * 根据用户ID获取菜单列表
 * @param {Number} userId - 用户ID
 * @returns {Promise} - 菜单列表
 */
const getMenusByUserId = async (userId) => {
  // 导入用户模型
  const User = mongoose.model('User');
  
  // 查询用户
  const user = await User.findById(userId);
  
  if (!user) {
    return [];
  }
  
  // 如果是超级管理员，返回所有菜单
  if (user.isAdmin) {
    const menus = await Menu.find().sort({ orderNum: 1 });
    return buildMenuTree(menus);
  }
  
  // 导入角色和角色菜单关联模型
  const UserRole = mongoose.model('UserRole');
  const RoleMenu = mongoose.model('RoleMenu');
  
  // 查询用户角色
  const userRoles = await UserRole.find({ userId });
  
  // 提取角色ID
  const roleIds = userRoles.map(ur => ur.roleId);
  
  // 查询角色菜单关联
  const roleMenus = await RoleMenu.find({ roleId: { $in: roleIds } });
  
  // 提取菜单ID
  const menuIds = [...new Set(roleMenus.map(rm => rm.menuId.toString()))];
  
  // 查询菜单
  const menus = await Menu.find({ _id: { $in: menuIds } }).sort({ orderNum: 1 });
  
  // 构建菜单树
  return buildMenuTree(menus);
};

/**
 * 更新角色菜单
 * @param {Number} roleId - 角色ID
 * @param {Array} menuIds - 菜单ID数组
 * @returns {Promise} - 操作结果
 */
const updateRoleMenus = async (roleId, menuIds) => {
  // 导入角色和角色菜单关联模型
  const Role = mongoose.model('Role');
  const RoleMenu = mongoose.model('RoleMenu');
  
  // 检查角色是否存在
  const role = await Role.findById(roleId);
  
  if (!role) {
    const error = new Error('角色不存在');
    error.status = 404;
    throw error;
  }
  
  // 如果是超级管理员角色，不允许修改
  if (role.code === 'admin') {
    const error = new Error('不能修改超级管理员菜单');
    error.status = 403;
    throw error;
  }
  
  // 开启事务
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 删除原有的角色菜单关联
    await RoleMenu.deleteMany({ roleId }, { session });
    
    // 创建新的角色菜单关联
    const roleMenus = menuIds.map(menuId => ({
      roleId,
      menuId
    }));
    
    // 批量插入新的角色菜单关联
    await RoleMenu.insertMany(roleMenus, { session });
    
    // 提交事务
    await session.commitTransaction();
    
    // 查询菜单
    const menus = await Menu.find({ _id: { $in: menuIds } }).sort({ orderNum: 1 });
    
    // 构建菜单树
    return buildMenuTree(menus);
  } catch (error) {
    // 回滚事务
    await session.abortTransaction();
    throw error;
  } finally {
    // 结束会话
    session.endSession();
  }
};

module.exports = {
  getAllMenus,
  getMenuTree,
  findMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  hasChildMenus,
  getMenusByRoleId,
  getMenusByUserId,
  updateRoleMenus
};