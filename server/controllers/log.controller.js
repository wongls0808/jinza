/**
 * 日志控制器
 */
const logModel = require('../models/log.model');

/**
 * 获取日志列表
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getLogs = async (req, res) => {
  try {
    const { type, username, ip, page = 1, pageSize = 10, startTime, endTime } = req.query;
    
    // 构建查询条件
    const filters = {};
    if (type) filters.type = type;
    if (username) filters.username = username;
    if (ip) filters.ip = ip;
    if (startTime && endTime) {
      filters.createTime = {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      };
    }
    
    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    // 获取日志
    const logs = await logModel.getLogs(filters, skip, limit);
    const total = await logModel.getLogCount(filters);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        records: logs,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取日志列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取日志详情
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await logModel.getLogById(id);
    
    if (!log) {
      return res.status(404).json({
        code: 404,
        message: '日志不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: log
    });
  } catch (error) {
    console.error('获取日志详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 删除日志
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await logModel.deleteLog(id);
    
    if (!success) {
      return res.status(404).json({
        code: 404,
        message: '日志不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除日志错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 清空日志
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const clearLogs = async (req, res) => {
  try {
    const { type, before } = req.body;
    
    // 验证参数
    if (!type && !before) {
      return res.status(400).json({
        code: 400,
        message: '请提供有效的清空条件',
        data: null
      });
    }
    
    // 构建清空条件
    const condition = {};
    if (type) condition.type = type;
    if (before) {
      condition.createTime = { $lt: new Date(before) };
    }
    
    const count = await logModel.clearLogs(condition);
    
    res.json({
      code: 200,
      message: `已清空${count}条日志`,
      data: { count }
    });
  } catch (error) {
    console.error('清空日志错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 导出日志
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const exportLogs = async (req, res) => {
  try {
    const { type, username, ip, startTime, endTime } = req.query;
    
    // 构建查询条件
    const filters = {};
    if (type) filters.type = type;
    if (username) filters.username = username;
    if (ip) filters.ip = ip;
    if (startTime && endTime) {
      filters.createTime = {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      };
    }
    
    // 导出日志
    const logs = await logModel.getLogs(filters);
    
    // 转换为CSV格式
    const fields = ['id', 'username', 'operation', 'method', 'params', 'ip', 'status', 'error', 'time', 'createTime'];
    const csv = await logModel.convertToCSV(logs, fields);
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=logs_${new Date().toISOString().split('T')[0]}.csv`);
    
    // 发送响应
    res.send(csv);
  } catch (error) {
    console.error('导出日志错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

/**
 * 获取日志类型统计
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 */
const getLogStats = async (req, res) => {
  try {
    const stats = await logModel.getLogTypeStats();
    
    res.json({
      code: 200,
      message: '获取成功',
      data: stats
    });
  } catch (error) {
    console.error('获取日志统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    });
  }
};

module.exports = {
  getLogs,
  getLogById,
  deleteLog,
  clearLogs,
  exportLogs,
  getLogStats
};