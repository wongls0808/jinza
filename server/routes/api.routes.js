/**
 * API路由配置文件
 * 集中管理所有API路由
 */
const express = require('express');
const router = express.Router();

// 导入控制器
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const roleController = require('../controllers/role.controller');
const menuController = require('../controllers/menu.controller');
const configController = require('../controllers/config.controller');
const logController = require('../controllers/log.controller');

// 导入中间件
const authMiddleware = require('../middleware/auth.middleware');
const permissionMiddleware = require('../middleware/permission.middleware');
const logMiddleware = require('../middleware/log.middleware');

// ===========================
// 公开接口，无需身份验证
// ===========================

// 认证相关路由
router.post('/auth/login', logMiddleware.logLogin, authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// 系统公开配置
router.get('/config/public', configController.getConfig);

// Tenants & Uploads (public for development/testing)
const tenantsRoutes = require('./tenants.routes');
router.use('/tenants', tenantsRoutes);

// ===========================
// 以下接口需要身份验证
// ===========================
router.use(authMiddleware.verifyToken);

// 认证相关路由
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh-token', authController.refreshToken);
router.get('/auth/profile', authController.getProfile);
router.put('/auth/profile', authController.updateProfile);
router.post('/auth/change-password', authController.changePassword);

// 用户管理路由
router.get('/users', permissionMiddleware.hasPermission('system:user:list'), userController.getUsers);
router.get('/users/:id', permissionMiddleware.hasPermission('system:user:query'), userController.getUserById);
router.post('/users', permissionMiddleware.hasPermission('system:user:create'), logMiddleware.logOperation, userController.createUser);
router.put('/users/:id', permissionMiddleware.hasPermission('system:user:update'), logMiddleware.logOperation, userController.updateUser);
router.delete('/users/:id', permissionMiddleware.hasPermission('system:user:delete'), logMiddleware.logOperation, userController.deleteUser);
router.put('/users/:id/status', permissionMiddleware.hasPermission('system:user:update'), logMiddleware.logOperation, userController.updateUserStatus);
router.put('/users/:id/role', permissionMiddleware.hasPermission('system:user:update'), logMiddleware.logOperation, userController.updateUserRole);
router.put('/users/:id/password/reset', permissionMiddleware.hasPermission('system:user:resetPwd'), logMiddleware.logOperation, userController.resetUserPassword);

// 角色管理路由
router.get('/roles', permissionMiddleware.hasPermission('system:role:list'), roleController.getRoles);
router.get('/roles/:id', permissionMiddleware.hasPermission('system:role:query'), roleController.getRoleById);
router.post('/roles', permissionMiddleware.hasPermission('system:role:create'), logMiddleware.logOperation, roleController.createRole);
router.put('/roles/:id', permissionMiddleware.hasPermission('system:role:update'), logMiddleware.logOperation, roleController.updateRole);
router.delete('/roles/:id', permissionMiddleware.hasPermission('system:role:delete'), logMiddleware.logOperation, roleController.deleteRole);
router.get('/roles/:code/permissions', permissionMiddleware.hasPermission('system:role:query'), roleController.getRolePermissions);
router.put('/roles/:code/permissions', permissionMiddleware.hasPermission('system:role:update'), logMiddleware.logOperation, roleController.updateRolePermissions);

// 权限管理路由
router.get('/permissions', permissionMiddleware.hasPermission('system:permission:list'), roleController.getAllPermissions);
router.get('/permissions/:type', permissionMiddleware.hasPermission('system:permission:list'), roleController.getPermissionsByType);

// 菜单管理路由
router.get('/menus', permissionMiddleware.hasPermission('system:menu:list'), menuController.getMenus);
router.get('/menus/:id', permissionMiddleware.hasPermission('system:menu:query'), menuController.getMenuById);
router.post('/menus', permissionMiddleware.hasPermission('system:menu:create'), logMiddleware.logOperation, menuController.createMenu);
router.put('/menus/:id', permissionMiddleware.hasPermission('system:menu:update'), logMiddleware.logOperation, menuController.updateMenu);
router.delete('/menus/:id', permissionMiddleware.hasPermission('system:menu:delete'), logMiddleware.logOperation, menuController.deleteMenu);
router.get('/roles/:roleId/menus', permissionMiddleware.hasPermission('system:role:query'), menuController.getRoleMenus);
router.put('/roles/:roleId/menus', permissionMiddleware.hasPermission('system:role:update'), logMiddleware.logOperation, menuController.updateRoleMenus);

// 用户菜单路由
router.get('/user/menus', menuController.getUserMenus);

// 系统配置路由
router.get('/config', permissionMiddleware.hasPermission('system:config:list'), configController.getConfig);
router.get('/config/groups', permissionMiddleware.hasPermission('system:config:list'), configController.getConfigGroups);
router.get('/config/group/:group', permissionMiddleware.hasPermission('system:config:list'), configController.getConfigByGroup);
router.put('/config/:key', permissionMiddleware.hasPermission('system:config:update'), logMiddleware.logOperation, configController.updateConfig);
router.post('/config/batch', permissionMiddleware.hasPermission('system:config:update'), logMiddleware.logOperation, configController.batchUpdateConfig);
router.post('/config/reset', permissionMiddleware.hasPermission('system:config:update'), logMiddleware.logOperation, configController.resetConfig);

// 系统日志路由
router.get('/logs', permissionMiddleware.hasPermission('system:log:list'), logController.getLogs);
router.get('/logs/:id', permissionMiddleware.hasPermission('system:log:query'), logController.getLogById);
router.delete('/logs/:id', permissionMiddleware.hasPermission('system:log:delete'), logController.deleteLog);
router.post('/logs/clear', permissionMiddleware.hasPermission('system:log:delete'), logController.clearLogs);
router.get('/logs/export', permissionMiddleware.hasPermission('system:log:export'), logController.exportLogs);
router.get('/logs/stats', permissionMiddleware.hasPermission('system:log:list'), logController.getLogStats);

// 导出路由
module.exports = router;