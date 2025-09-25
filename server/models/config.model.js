/**
 * 系统配置模型
 */
const mongoose = require('mongoose');

// 定义配置Schema
const configSchema = new mongoose.Schema({
  // 配置键名
  key: { 
    type: String, 
    required: true, 
    unique: true 
  },
  // 配置值
  value: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  // 配置名称
  name: { 
    type: String, 
    required: true 
  },
  // 配置分组
  group: { 
    type: String, 
    required: true 
  },
  // 配置类型
  type: { 
    type: String, 
    required: true,
    enum: ['string', 'number', 'boolean', 'array', 'object']
  },
  // 是否受保护（受保护的配置不能通过API修改）
  protected: { 
    type: Boolean, 
    default: false 
  },
  // 配置描述
  description: { 
    type: String 
  },
  // 配置排序
  orderNum: { 
    type: Number, 
    default: 0 
  },
  // 创建时间
  createTime: { 
    type: Date, 
    default: Date.now 
  },
  // 更新时间
  updateTime: { 
    type: Date, 
    default: Date.now 
  }
});

// 创建索引
configSchema.index({ key: 1 }, { unique: true });
configSchema.index({ group: 1 });
configSchema.index({ orderNum: 1 });

// 创建模型
const Config = mongoose.model('Config', configSchema);

/**
 * 获取所有配置
 * @returns {Promise} - 配置列表
 */
const getAllConfig = async () => {
  return await Config.find()
    .sort({ group: 1, orderNum: 1 });
};

/**
 * 根据键名获取配置
 * @param {String} key - 配置键名
 * @returns {Promise} - 配置对象
 */
const getConfigByKey = async (key) => {
  return await Config.findOne({ key });
};

/**
 * 获取配置分组
 * @returns {Promise} - 分组列表
 */
const getConfigGroups = async () => {
  return await Config.aggregate([
    {
      $group: {
        _id: '$group',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        group: '$_id',
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { group: 1 }
    }
  ]);
};

/**
 * 根据分组获取配置
 * @param {String} group - 配置分组
 * @returns {Promise} - 配置列表
 */
const getConfigByGroup = async (group) => {
  return await Config.find({ group })
    .sort({ orderNum: 1 });
};

/**
 * 更新配置
 * @param {String} key - 配置键名
 * @param {*} value - 配置值
 * @returns {Promise} - 更新后的配置对象
 */
const updateConfig = async (key, value) => {
  // 检查配置是否存在
  const config = await Config.findOne({ key });
  
  if (!config) {
    return null;
  }
  
  // 检查是否受保护
  if (config.protected) {
    const error = new Error('配置项受保护，不能修改');
    error.status = 403;
    throw error;
  }
  
  // 转换值类型
  const typedValue = convertValueType(value, config.type);
  
  // 更新配置
  return await Config.findOneAndUpdate(
    { key },
    { 
      value: typedValue,
      updateTime: new Date()
    },
    { new: true }
  );
};

/**
 * 批量更新配置
 * @param {Array} configs - 配置数组
 * @returns {Promise} - 更新后的配置列表
 */
const batchUpdateConfig = async (configs) => {
  const updated = [];
  const errors = [];
  
  // 获取所有配置
  const existingConfigs = await Config.find();
  const configMap = {};
  
  existingConfigs.forEach(config => {
    configMap[config.key] = config;
  });
  
  // 遍历更新配置
  for (const item of configs) {
    try {
      // 检查配置是否存在
      const config = configMap[item.key];
      
      if (!config) {
        errors.push(`配置项不存在: ${item.key}`);
        continue;
      }
      
      // 检查是否受保护
      if (config.protected) {
        errors.push(`配置项受保护: ${item.key}`);
        continue;
      }
      
      // 转换值类型
      const typedValue = convertValueType(item.value, config.type);
      
      // 更新配置
      const updatedConfig = await Config.findOneAndUpdate(
        { key: item.key },
        { 
          value: typedValue,
          updateTime: new Date()
        },
        { new: true }
      );
      
      updated.push(updatedConfig);
    } catch (error) {
      errors.push(`更新配置项错误 ${item.key}: ${error.message}`);
    }
  }
  
  // 如果有错误，抛出异常
  if (errors.length > 0) {
    const error = new Error(`部分配置项更新失败: ${errors.join(', ')}`);
    error.partial = true;
    error.updated = updated;
    error.errors = errors;
    throw error;
  }
  
  return updated;
};

/**
 * 重置为默认配置
 * @returns {Promise} - 重置结果
 */
const resetToDefaultConfig = async () => {
  // 获取默认配置
  const defaultConfigs = getDefaultConfigs();
  
  // 更新所有非受保护配置
  const updatedConfigs = [];
  
  for (const defaultConfig of defaultConfigs) {
    // 查找配置
    const config = await Config.findOne({ key: defaultConfig.key });
    
    if (config && !config.protected) {
      // 更新为默认值
      const updatedConfig = await Config.findOneAndUpdate(
        { key: defaultConfig.key },
        { 
          value: defaultConfig.value,
          updateTime: new Date()
        },
        { new: true }
      );
      
      updatedConfigs.push(updatedConfig);
    }
  }
  
  return updatedConfigs;
};

/**
 * 转换值类型
 * @param {*} value - 值
 * @param {String} type - 类型
 * @returns {*} - 转换后的值
 */
const convertValueType = (value, type) => {
  try {
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);
      case 'array':
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return Array.isArray(value) ? value : [value];
      case 'object':
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return value;
      default:
        return value;
    }
  } catch (error) {
    throw new Error(`类型转换错误: ${error.message}`);
  }
};

/**
 * 获取默认配置
 * @returns {Array} - 默认配置列表
 */
const getDefaultConfigs = () => {
  return [
    {
      key: 'system.name',
      value: 'Jinza管理系统',
      name: '系统名称',
      group: '系统设置',
      type: 'string',
      protected: false,
      description: '系统名称，显示在页面标题和登录页',
      orderNum: 1
    },
    {
      key: 'system.logo',
      value: '/static/logo.png',
      name: '系统Logo',
      group: '系统设置',
      type: 'string',
      protected: false,
      description: '系统Logo路径',
      orderNum: 2
    },
    {
      key: 'system.favicon',
      value: '/static/favicon.ico',
      name: '系统图标',
      group: '系统设置',
      type: 'string',
      protected: false,
      description: '浏览器标签页图标路径',
      orderNum: 3
    },
    {
      key: 'system.footer',
      value: '© 2023 Jinza Admin System. All Rights Reserved.',
      name: '页脚文本',
      group: '系统设置',
      type: 'string',
      protected: false,
      description: '页脚版权信息',
      orderNum: 4
    },
    {
      key: 'system.theme',
      value: 'light',
      name: '系统主题',
      group: '系统设置',
      type: 'string',
      protected: false,
      description: '系统默认主题，可选：light, dark',
      orderNum: 5
    },
    {
      key: 'security.loginRetries',
      value: 5,
      name: '登录重试次数',
      group: '安全设置',
      type: 'number',
      protected: false,
      description: '允许的最大登录失败次数，超过后账户将被锁定',
      orderNum: 1
    },
    {
      key: 'security.lockTime',
      value: 30,
      name: '锁定时间',
      group: '安全设置',
      type: 'number',
      protected: false,
      description: '账户锁定时间（分钟）',
      orderNum: 2
    },
    {
      key: 'security.passwordExpiration',
      value: 90,
      name: '密码过期天数',
      group: '安全设置',
      type: 'number',
      protected: false,
      description: '密码过期时间（天），0表示永不过期',
      orderNum: 3
    },
    {
      key: 'security.passwordHistory',
      value: 3,
      name: '密码历史记录',
      group: '安全设置',
      type: 'number',
      protected: false,
      description: '记住多少个历史密码，防止重复使用',
      orderNum: 4
    },
    {
      key: 'security.passwordComplexity',
      value: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false
      },
      name: '密码复杂度',
      group: '安全设置',
      type: 'object',
      protected: false,
      description: '密码复杂度要求',
      orderNum: 5
    },
    {
      key: 'upload.maxSize',
      value: 10485760, // 10MB
      name: '上传文件大小限制',
      group: '文件上传',
      type: 'number',
      protected: false,
      description: '上传文件大小限制（字节）',
      orderNum: 1
    },
    {
      key: 'upload.allowTypes',
      value: [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      name: '允许上传的文件类型',
      group: '文件上传',
      type: 'array',
      protected: false,
      description: '允许上传的MIME类型列表',
      orderNum: 2
    }
  ];
};

/**
 * 初始化默认配置
 * @returns {Promise} - 初始化结果
 */
const initDefaultConfig = async () => {
  const defaultConfigs = getDefaultConfigs();
  const configCount = await Config.countDocuments();
  
  // 如果已经有配置，则不初始化
  if (configCount > 0) {
    return;
  }
  
  // 批量插入默认配置
  await Config.insertMany(defaultConfigs);
  
  return defaultConfigs;
};

module.exports = {
  getAllConfig,
  getConfigByKey,
  getConfigGroups,
  getConfigByGroup,
  updateConfig,
  batchUpdateConfig,
  resetToDefaultConfig,
  initDefaultConfig
};