/**
 * 身份验证中间件
 */
const jwt = require('jsonwebtoken');
const { app } = require('../config/app.config');

/**
 * 验证JWT令牌
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({
    code: 401,
    message: '未授权访问',
    data: null
  });
  
  jwt.verify(token, app.jwtSecret, (err, user) => {
    if (err) return res.status(403).json({
      code: 403,
      message: '无效或过期的令牌',
      data: null
    });
    
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};