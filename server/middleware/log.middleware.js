/**
 * 日志记录中间件
 */
const logModel = require('../models/log.model');
const { getClientIP } = require('../utils/request.util');

/**
 * 记录登录日志
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {Function} next - Express下一个中间件
 */
const logLogin = async (req, res, next) => {
  // 保存原始状态码设置方法
  const originalStatus = res.status;
  const originalJson = res.json;
  const originalSend = res.send;
  
  // 开始计时
  const startTime = Date.now();
  
  // 重写状态码设置方法
  res.status = function(code) {
    res.statusCode = code;
    return originalStatus.call(this, code);
  };
  
  // 定义完成处理函数
  const logRequest = async (body) => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 准备日志数据
      const logData = {
        type: 'LOGIN',
        username: req.body.username || 'unknown',
        operation: '用户登录',
        method: req.method,
        params: JSON.stringify({
          username: req.body.username,
          // 不记录密码
          password: '******' 
        }),
        ip: getClientIP(req),
        userAgent: req.headers['user-agent'],
        status: res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'FAIL',
        error: res.statusCode >= 400 ? body.message || '登录失败' : null,
        time: responseTime,
        createTime: new Date()
      };
      
      // 保存日志
      await logModel.createLog(logData);
    } catch (error) {
      console.error('记录登录日志错误:', error);
    }
  };
  
  // 重写json方法
  res.json = function(body) {
    logRequest(body).catch(console.error);
    return originalJson.call(this, body);
  };
  
  // 重写send方法
  res.send = function(body) {
    if (typeof body === 'string') {
      try {
        const parsedBody = JSON.parse(body);
        logRequest(parsedBody).catch(console.error);
      } catch (e) {
        logRequest({ message: body }).catch(console.error);
      }
    } else {
      logRequest(body).catch(console.error);
    }
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * 记录操作日志
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @param {Function} next - Express下一个中间件
 */
const logOperation = async (req, res, next) => {
  // 保存原始状态码设置方法
  const originalStatus = res.status;
  const originalJson = res.json;
  const originalSend = res.send;
  
  // 开始计时
  const startTime = Date.now();
  
  // 获取操作类型
  let operation = '未知操作';
  const path = req.originalUrl.split('?')[0];
  
  if (path.includes('/users')) {
    if (req.method === 'POST') operation = '创建用户';
    else if (req.method === 'PUT' && path.includes('/status')) operation = '修改用户状态';
    else if (req.method === 'PUT' && path.includes('/role')) operation = '分配用户角色';
    else if (req.method === 'PUT' && path.includes('/password/reset')) operation = '重置用户密码';
    else if (req.method === 'PUT') operation = '修改用户信息';
    else if (req.method === 'DELETE') operation = '删除用户';
  } else if (path.includes('/roles')) {
    if (req.method === 'POST') operation = '创建角色';
    else if (req.method === 'PUT' && path.includes('/permissions')) operation = '修改角色权限';
    else if (req.method === 'PUT') operation = '修改角色信息';
    else if (req.method === 'DELETE') operation = '删除角色';
  } else if (path.includes('/menus')) {
    if (req.method === 'POST') operation = '创建菜单';
    else if (req.method === 'PUT') operation = '修改菜单信息';
    else if (req.method === 'DELETE') operation = '删除菜单';
  } else if (path.includes('/config')) {
    if (req.method === 'PUT') operation = '修改系统配置';
    else if (req.method === 'POST' && path.includes('/batch')) operation = '批量修改系统配置';
    else if (req.method === 'POST' && path.includes('/reset')) operation = '重置系统配置';
  }
  
  // 重写状态码设置方法
  res.status = function(code) {
    res.statusCode = code;
    return originalStatus.call(this, code);
  };
  
  // 定义完成处理函数
  const logRequest = async (body) => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 准备日志数据
      const logData = {
        type: 'OPERATION',
        username: req.user ? req.user.username : 'unknown',
        operation,
        method: req.method,
        params: JSON.stringify({
          url: req.originalUrl,
          body: req.body,
          params: req.params,
          query: req.query
        }),
        ip: getClientIP(req),
        userAgent: req.headers['user-agent'],
        status: res.statusCode >= 200 && res.statusCode < 400 ? 'SUCCESS' : 'FAIL',
        error: res.statusCode >= 400 ? body.message || '操作失败' : null,
        time: responseTime,
        createTime: new Date()
      };
      
      // 保存日志
      await logModel.createLog(logData);
    } catch (error) {
      console.error('记录操作日志错误:', error);
    }
  };
  
  // 重写json方法
  res.json = function(body) {
    logRequest(body).catch(console.error);
    return originalJson.call(this, body);
  };
  
  // 重写send方法
  res.send = function(body) {
    if (typeof body === 'string') {
      try {
        const parsedBody = JSON.parse(body);
        logRequest(parsedBody).catch(console.error);
      } catch (e) {
        logRequest({ message: body }).catch(console.error);
      }
    } else {
      logRequest(body).catch(console.error);
    }
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = {
  logLogin,
  logOperation
};