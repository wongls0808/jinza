/**
 * 角色和权限中间件
 */
const { getRolePermissions } = require('../models/role.model');

/**
 * 检查用户是否拥有指定权限
 * @param {string} permission - 需要检查的权限标识
 * @returns {Function} - Express中间件函数
 */
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // 获取用户角色
      const { role } = req.user;
      
      if (!role) {
        return res.status(403).json({
          code: 403,
          message: '无效的用户角色',
          data: null
        });
      }
      
      // 获取角色权限
      const permissions = await getRolePermissions(role);
      
      // 超级管理员有所有权限
      if (role === 'admin') {
        return next();
      }
      
      // 检查是否拥有指定权限
      if (permissions.includes(permission)) {
        next();
      } else {
        res.status(403).json({
          code: 403,
          message: '没有足够权限执行此操作',
          data: null
        });
      }
    } catch (error) {
      console.error('权限检查错误:', error);
      res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        data: null
      });
    }
  };
};

/**
 * 检查用户是否属于指定角色
 * @param {string|string[]} roles - 允许的角色或角色数组
 * @returns {Function} - Express中间件函数
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    const { role } = req.user;
    
    if (!role) {
      return res.status(403).json({
        code: 403,
        message: '无效的用户角色',
        data: null
      });
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // 超级管理员有所有权限
    if (role === 'admin') {
      return next();
    }
    
    if (allowedRoles.includes(role)) {
      next();
    } else {
      res.status(403).json({
        code: 403,
        message: '没有足够权限执行此操作',
        data: null
      });
    }
  };
};

module.exports = {
  hasPermission,
  hasRole
};