/**
 * 用户控制器
 */
const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

/**
 * 获取用户列表
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getUsers = async (req, res) => {
  try {
    // 获取查询参数
    const { username, role, department, status, page = 1, pageSize = 10 } = req.query;
    
    // 构建过滤条件
    const filters = {};
    if (username) filters.username = username;
    if (role) filters.role = role;
    if (department) filters.department = department;
    if (status !== undefined) filters.status = status;
    
    // 获取用户列表
    const users = await userModel.findAll(filters);
    
    // 分页处理
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: users.length,
        list: paginatedUsers
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取单个用户信息
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await userModel.findById(parseInt(id));
    
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
 * 创建用户
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    
    // 验证必填字段
    if (!userData.username || !userData.password || !userData.role) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码和角色不能为空',
        data: null
      });
    }
    
    // 在真实应用中应对密码进行加密
    // userData.password = await bcrypt.hash(userData.password, 10);
    
    // 创建用户
    const newUser = await userModel.create(userData);
    
    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: newUser
    });
  } catch (error) {
    console.error('创建用户错误:', error);
    
    // 处理特定错误
    if (error.message === '用户名已存在') {
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
 * 更新用户信息
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    // 如果要更新密码，需要加密
    // if (userData.password) {
    //   userData.password = await bcrypt.hash(userData.password, 10);
    // }
    
    const updatedUser = await userModel.update(parseInt(id), userData);
    
    if (!updatedUser) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '更新成功',
      data: updatedUser
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    
    // 处理特定错误
    if (error.message === '用户名已存在') {
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
 * 删除用户
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 禁止删除超级管理员
    if (parseInt(id) === 1) {
      return res.status(403).json({
        code: 403,
        message: '不能删除超级管理员',
        data: null
      });
    }
    
    const success = await userModel.remove(parseInt(id));
    
    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};