/**
 * 系统配置控制器
 */
const configModel = require('../models/config.model');

/**
 * 获取系统配置
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getConfig = async (req, res) => {
  try {
    // 获取查询参数
    const { key } = req.query;
    
    let config;
    if (key) {
      // 获取特定配置项
      config = await configModel.getConfigByKey(key);
      
      if (!config) {
        return res.status(404).json({
          code: 404,
          message: '配置项不存在',
          data: null
        });
      }
    } else {
      // 获取所有配置
      config = await configModel.getAllConfig();
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: config
    });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取系统配置分组
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getConfigGroups = async (req, res) => {
  try {
    const groups = await configModel.getConfigGroups();
    
    res.json({
      code: 200,
      message: '获取成功',
      data: groups
    });
  } catch (error) {
    console.error('获取系统配置分组错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 根据分组获取配置
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getConfigByGroup = async (req, res) => {
  try {
    const { group } = req.params;
    
    const config = await configModel.getConfigByGroup(group);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: config
    });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 更新系统配置
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // 验证参数
    if (value === undefined) {
      return res.status(400).json({
        code: 400,
        message: '配置值不能为空',
        data: null
      });
    }
    
    const updated = await configModel.updateConfig(key, value);
    
    if (!updated) {
      return res.status(404).json({
        code: 404,
        message: '配置项不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '更新成功',
      data: { key, value }
    });
  } catch (error) {
    console.error('更新系统配置错误:', error);
    
    // 处理特定错误
    if (error.message === '配置项受保护，不能修改') {
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
 * 批量更新系统配置
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const batchUpdateConfig = async (req, res) => {
  try {
    const configs = req.body;
    
    // 验证参数
    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供有效的配置数组',
        data: null
      });
    }
    
    // 验证每个配置项
    for (const config of configs) {
      if (!config.key || config.value === undefined) {
        return res.status(400).json({
          code: 400,
          message: '每个配置项必须包含key和value',
          data: null
        });
      }
    }
    
    const updated = await configModel.batchUpdateConfig(configs);
    
    res.json({
      code: 200,
      message: '更新成功',
      data: updated
    });
  } catch (error) {
    console.error('批量更新系统配置错误:', error);
    
    // 处理特定错误
    if (error.message.includes('受保护')) {
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
 * 重置系统配置
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const resetConfig = async (req, res) => {
  try {
    // 重置为默认配置
    const result = await configModel.resetToDefaultConfig();
    
    res.json({
      code: 200,
      message: '重置成功',
      data: result
    });
  } catch (error) {
    console.error('重置系统配置错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

module.exports = {
  getConfig,
  getConfigGroups,
  getConfigByGroup,
  updateConfig,
  batchUpdateConfig,
  resetConfig
};