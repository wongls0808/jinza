/**
 * 日志模型
 */
const mongoose = require('mongoose');
const { createObjectCsvStringifier } = require('csv-writer');

// 定义日志Schema
const logSchema = new mongoose.Schema({
  // 日志类型：LOGIN-登录日志，OPERATION-操作日志
  type: { 
    type: String, 
    required: true,
    enum: ['LOGIN', 'OPERATION']
  },
  // 操作用户
  username: { 
    type: String, 
    required: true 
  },
  // 操作内容
  operation: { 
    type: String, 
    required: true 
  },
  // 请求方法
  method: { 
    type: String
  },
  // 请求参数
  params: { 
    type: String 
  },
  // 操作IP
  ip: { 
    type: String 
  },
  // 用户代理
  userAgent: { 
    type: String 
  },
  // 操作状态：SUCCESS-成功，FAIL-失败
  status: { 
    type: String,
    enum: ['SUCCESS', 'FAIL'],
    default: 'SUCCESS'
  },
  // 错误消息
  error: { 
    type: String 
  },
  // 操作耗时(ms)
  time: { 
    type: Number 
  },
  // 创建时间
  createTime: { 
    type: Date, 
    default: Date.now 
  }
});

// 创建索引
logSchema.index({ type: 1 });
logSchema.index({ username: 1 });
logSchema.index({ createTime: -1 });
logSchema.index({ status: 1 });
logSchema.index({ operation: 1 });

// 创建模型
const Log = mongoose.model('Log', logSchema);

/**
 * 创建日志
 * @param {Object} logData - 日志数据
 * @returns {Promise} - 创建的日志对象
 */
const createLog = async (logData) => {
  const log = new Log(logData);
  return await log.save();
};

/**
 * 获取日志列表
 * @param {Object} filters - 过滤条件
 * @param {Number} skip - 跳过的记录数
 * @param {Number} limit - 返回的最大记录数
 * @returns {Promise} - 日志列表
 */
const getLogs = async (filters = {}, skip = 0, limit = 0) => {
  return await Log.find(filters)
    .sort({ createTime: -1 })
    .skip(skip)
    .limit(limit > 0 ? limit : 0);
};

/**
 * 获取日志数量
 * @param {Object} filters - 过滤条件
 * @returns {Promise} - 日志数量
 */
const getLogCount = async (filters = {}) => {
  return await Log.countDocuments(filters);
};

/**
 * 获取单条日志
 * @param {String} id - 日志ID
 * @returns {Promise} - 日志对象
 */
const getLogById = async (id) => {
  return await Log.findById(id);
};

/**
 * 删除日志
 * @param {String} id - 日志ID
 * @returns {Promise} - 操作结果
 */
const deleteLog = async (id) => {
  const result = await Log.deleteOne({ _id: id });
  return result.deletedCount > 0;
};

/**
 * 清空日志
 * @param {Object} condition - 清空条件
 * @returns {Promise} - 清空的记录数
 */
const clearLogs = async (condition = {}) => {
  const result = await Log.deleteMany(condition);
  return result.deletedCount;
};

/**
 * 将日志数据转换为CSV格式
 * @param {Array} logs - 日志数据数组
 * @param {Array} fields - 字段列表
 * @returns {Promise} - CSV格式的字符串
 */
const convertToCSV = async (logs, fields) => {
  // 创建CSV格式化工具
  const csvStringifier = createObjectCsvStringifier({
    header: fields.map(field => ({
      id: field,
      title: field
    }))
  });
  
  // 格式化数据
  const records = logs.map(log => {
    const record = {};
    fields.forEach(field => {
      if (field === 'createTime' && log[field]) {
        record[field] = new Date(log[field]).toLocaleString();
      } else {
        record[field] = log[field];
      }
    });
    return record;
  });
  
  // 生成CSV
  const header = csvStringifier.getHeaderString();
  const body = csvStringifier.stringifyRecords(records);
  
  return header + body;
};

/**
 * 获取日志类型统计
 * @returns {Promise} - 统计结果
 */
const getLogTypeStats = async () => {
  // 获取总体统计
  const totalStats = await Log.aggregate([
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        fail: {
          $sum: { $cond: [{ $eq: ['$status', 'FAIL'] }, 1, 0] }
        }
      }
    }
  ]);
  
  // 获取今日统计
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStats = await Log.aggregate([
    {
      $match: {
        createTime: { $gte: today }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        fail: {
          $sum: { $cond: [{ $eq: ['$status', 'FAIL'] }, 1, 0] }
        }
      }
    }
  ]);
  
  // 合并结果
  const result = {
    total: {
      login: { total: 0, success: 0, fail: 0 },
      operation: { total: 0, success: 0, fail: 0 }
    },
    today: {
      login: { total: 0, success: 0, fail: 0 },
      operation: { total: 0, success: 0, fail: 0 }
    }
  };
  
  totalStats.forEach(stat => {
    if (stat._id === 'LOGIN') {
      result.total.login = {
        total: stat.total,
        success: stat.success,
        fail: stat.fail
      };
    } else if (stat._id === 'OPERATION') {
      result.total.operation = {
        total: stat.total,
        success: stat.success,
        fail: stat.fail
      };
    }
  });
  
  todayStats.forEach(stat => {
    if (stat._id === 'LOGIN') {
      result.today.login = {
        total: stat.total,
        success: stat.success,
        fail: stat.fail
      };
    } else if (stat._id === 'OPERATION') {
      result.today.operation = {
        total: stat.total,
        success: stat.success,
        fail: stat.fail
      };
    }
  });
  
  return result;
};

module.exports = {
  createLog,
  getLogs,
  getLogCount,
  getLogById,
  deleteLog,
  clearLogs,
  convertToCSV,
  getLogTypeStats
};