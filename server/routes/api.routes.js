/**
 * API路由配置文件
 */
const express = require('express');
const router = express.Router();

// 健康检查路由 
router.get('/health', (req, res) => {
  res.status(200).json({
    code: 200,
    message: 'API is running',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

// 租户和上传路由 (开放给前端访问)
const tenantsRoutes = require('./tenants.routes');
router.use('/tenants', tenantsRoutes);

// 其他路由示例
router.get('/users', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: [
      { id: 1, username: 'admin', nickname: '管理员' },
      { id: 2, username: 'user', nickname: '普通用户' }
    ]
  });
});

// 导出路由
module.exports = router;