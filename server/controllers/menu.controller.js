/**
 * 系统菜单控制器
 */
const menuModel = require('../models/menu.model');

/**
 * 获取菜单列表
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getMenus = async (req, res) => {
  try {
    // 获取查询参数
    const { type } = req.query;
    
    let menus;
    if (type === 'tree') {
      // 获取树状结构菜单
      menus = await menuModel.getMenuTree();
    } else {
      // 获取扁平菜单列表
      menus = await menuModel.getAllMenus();
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: menus
    });
  } catch (error) {
    console.error('获取菜单列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取单个菜单信息
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const menu = await menuModel.findMenuById(parseInt(id));
    
    if (!menu) {
      return res.status(404).json({
        code: 404,
        message: '菜单不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: menu
    });
  } catch (error) {
    console.error('获取菜单信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 创建菜单
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const createMenu = async (req, res) => {
  try {
    const menuData = req.body;
    
    // 验证必填字段
    if (!menuData.name || !menuData.path) {
      return res.status(400).json({
        code: 400,
        message: '菜单名称和路径不能为空',
        data: null
      });
    }
    
    // 创建菜单
    const newMenu = await menuModel.createMenu(menuData);
    
    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: newMenu
    });
  } catch (error) {
    console.error('创建菜单错误:', error);
    
    // 处理特定错误
    if (error.message === '菜单路径已存在') {
      return res.status(409).json({
        code: 409,
        message: error.message,
        data: null
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 更新菜单信息
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menuData = req.body;
    
    const updatedMenu = await menuModel.updateMenu(parseInt(id), menuData);
    
    if (!updatedMenu) {
      return res.status(404).json({
        code: 404,
        message: '菜单不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '更新成功',
      data: updatedMenu
    });
  } catch (error) {
    console.error('更新菜单错误:', error);
    
    // 处理特定错误
    if (error.message === '菜单路径已存在') {
      return res.status(409).json({
        code: 409,
        message: error.message,
        data: null
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 删除菜单
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查是否存在子菜单
    const hasChildren = await menuModel.hasChildMenus(parseInt(id));
    if (hasChildren) {
      return res.status(400).json({
        code: 400,
        message: '请先删除所有子菜单',
        data: null
      });
    }
    
    const success = await menuModel.deleteMenu(parseInt(id));
    
    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '菜单不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除菜单错误:', error);
    
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取角色菜单
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getRoleMenus = async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const menus = await menuModel.getMenusByRoleId(parseInt(roleId));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: menus
    });
  } catch (error) {
    console.error('获取角色菜单错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取用户菜单
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getUserMenus = async (req, res) => {
  try {
    // 从中间件获取当前用户
    const { userId } = req.user;
    
    const menus = await menuModel.getMenusByUserId(parseInt(userId));
    
    res.json({
      code: 200,
      message: '获取成功',
      data: menus
    });
  } catch (error) {
    console.error('获取用户菜单错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 更新角色菜单
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const updateRoleMenus = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { menuIds } = req.body;
    
    if (!Array.isArray(menuIds)) {
      return res.status(400).json({
        code: 400,
        message: '菜单ID必须是数组',
        data: null
      });
    }
    
    // 更新角色菜单
    const updatedMenus = await menuModel.updateRoleMenus(parseInt(roleId), menuIds);
    
    res.json({
      code: 200,
      message: '更新成功',
      data: updatedMenus
    });
  } catch (error) {
    console.error('更新角色菜单错误:', error);
    
    // 处理特定错误
    if (error.message === '角色不存在' || error.message === '不能修改超级管理员菜单') {
      return res.status(403).json({
        code: 403,
        message: error.message,
        data: null
      });
    }
    
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

module.exports = {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getRoleMenus,
  getUserMenus,
  updateRoleMenus
};