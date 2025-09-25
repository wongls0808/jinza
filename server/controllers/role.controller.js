/**
 * 角色和权限控制器
 */
const roleModel = require('../models/role.model');
const permissionModel = require('../models/permission.model');

/**
 * 获取角色列表
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getRoles = async (req, res) => {
  try {
    const roles = await roleModel.getAllRoles();
    
    res.json({
      code: 200,
      message: '获取成功',
      data: roles
    });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取单个角色信息
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await roleModel.findRoleById(parseInt(id));
    
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: role
    });
  } catch (error) {
    console.error('获取角色信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 创建角色
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const createRole = async (req, res) => {
  try {
    const roleData = req.body;
    
    // 验证必填字段
    if (!roleData.code || !roleData.name) {
      return res.status(400).json({
        code: 400,
        message: '角色代码和名称不能为空',
        data: null
      });
    }
    
    // 创建角色
    const newRole = await roleModel.createRole(roleData);
    
    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: newRole
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    
    // 处理特定错误
    if (error.message === '角色代码已存在') {
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
 * 更新角色信息
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const roleData = req.body;
    
    const updatedRole = await roleModel.updateRole(parseInt(id), roleData);
    
    if (!updatedRole) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '更新成功',
      data: updatedRole
    });
  } catch (error) {
    console.error('更新角色错误:', error);
    
    // 处理特定错误
    if (error.message === '角色代码已存在') {
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
 * 删除角色
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await roleModel.deleteRole(parseInt(id));
    
    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除角色错误:', error);
    
    // 处理特定错误
    if (error.message === '不能删除系统预设角色') {
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

/**
 * 获取角色权限
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getRolePermissions = async (req, res) => {
  try {
    const { code } = req.params;
    
    const role = await roleModel.findRoleByCode(code);
    
    if (!role) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在',
        data: null
      });
    }
    
    const permissions = await roleModel.getRolePermissions(code);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: permissions
    });
  } catch (error) {
    console.error('获取角色权限错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 更新角色权限
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const updateRolePermissions = async (req, res) => {
  try {
    const { code } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        code: 400,
        message: '权限必须是数组',
        data: null
      });
    }
    
    // 验证权限是否有效
    for (const permission of permissions) {
      const isValid = await permissionModel.isValidPermission(permission);
      if (!isValid) {
        return res.status(400).json({
          code: 400,
          message: `无效的权限: ${permission}`,
          data: null
        });
      }
    }
    
    const updatedPermissions = await roleModel.updateRolePermissions(code, permissions);
    
    res.json({
      code: 200,
      message: '更新成功',
      data: updatedPermissions
    });
  } catch (error) {
    console.error('更新角色权限错误:', error);
    
    // 处理特定错误
    if (error.message === '不能修改超级管理员权限' || error.message === '角色不存在') {
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

/**
 * 获取所有权限
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await permissionModel.getAllPermissions();
    
    res.json({
      code: 200,
      message: '获取成功',
      data: permissions
    });
  } catch (error) {
    console.error('获取权限列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 根据类型获取权限
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getPermissionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    const permissions = await permissionModel.getPermissionsByType(type);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: permissions
    });
  } catch (error) {
    console.error('获取权限列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  getAllPermissions,
  getPermissionsByType
};