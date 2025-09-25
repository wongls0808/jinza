/**
 * 身份验证控制器
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { app } = require('../config/app.config');
const userModel = require('../models/user.model');

/**
 * 用户登录
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证请求参数
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
        data: null
      });
    }

    // 查找用户
    const user = await userModel.findByUsername(username);
    
    // 用户不存在
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 用户已被禁用
    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账号已被禁用',
        data: null
      });
    }

    // 验证密码（实际应用中应使用bcrypt等加密算法）
    // 为了简化示例，这里直接比较明文密码
    const isPasswordValid = password === user.password;
    // 使用bcrypt的写法应该是：
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 更新登录时间
    await userModel.updateLastLoginTime(user.id);

    // 生成JWT令牌
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      app.jwtSecret,
      { expiresIn: app.jwtExpiresIn }
    );

    // 返回用户信息和令牌
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取当前用户信息
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getUserInfo = async (req, res) => {
  try {
    // req.user 已在身份验证中间件中设置
    const user = await userModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    // 不返回密码
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      code: 200,
      message: '获取成功',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 刷新令牌
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const refreshToken = async (req, res) => {
  try {
    // req.user 已在身份验证中间件中设置
    const { id, username, role } = req.user;
    
    // 生成新JWT令牌
    const token = jwt.sign(
      { id, username, role },
      app.jwtSecret,
      { expiresIn: app.jwtExpiresIn }
    );
    
    res.json({
      code: 200,
      message: '令牌刷新成功',
      data: { token }
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 退出登录
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const logout = async (req, res) => {
  // JWT是无状态的，服务端无法直接使令牌失效
  // 客户端应该删除本地存储的令牌
  // 这里只是为了提供一个统一的API
  res.json({
    code: 200,
    message: '退出成功',
    data: null
  });
};

module.exports = {
  login,
  getUserInfo,
  refreshToken,
  logout
};