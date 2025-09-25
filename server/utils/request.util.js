/**
 * 辅助工具 - 请求处理
 */

/**
 * 获取客户端真实IP地址
 * @param {Request} req - Express请求对象
 * @returns {String} - IP地址
 */
const getClientIP = (req) => {
  // 尝试从各种代理头中获取IP
  const ip = 
    req.headers['x-forwarded-for'] || 
    req.headers['x-real-ip'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress || 
    req.connection.socket?.remoteAddress || 
    '';
  
  // 如果是X-Forwarded-For，可能包含多个IP，取第一个
  if (ip && ip.includes(',')) {
    return ip.split(',')[0].trim();
  }
  
  // 如果是IPv6格式的IPv4，去掉前缀
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip || 'unknown';
};

/**
 * 从请求头中获取用户代理信息
 * @param {Request} req - Express请求对象
 * @returns {Object} - 用户代理信息
 */
const getUserAgent = (req) => {
  const ua = req.headers['user-agent'] || '';
  
  // 简单的浏览器检测
  let browser = 'unknown';
  let os = 'unknown';
  let device = 'unknown';
  
  // 检测操作系统
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac OS')) {
    os = 'macOS';
  } else if (ua.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    if (ua.includes('iPad')) {
      device = 'Tablet';
    } else {
      device = 'Mobile';
    }
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }
  
  // 检测浏览器
  if (ua.includes('MSIE') || ua.includes('Trident/')) {
    browser = 'Internet Explorer';
  } else if (ua.includes('Edge')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('Chrome') && !ua.includes('Chromium') && !ua.includes('Edg/')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox') && !ua.includes('Seamonkey')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium')) {
    browser = 'Safari';
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    browser = 'Opera';
  }
  
  // 检测设备类型
  if (device === 'unknown') {
    if (ua.includes('Mobile')) {
      device = 'Mobile';
    } else if (ua.includes('Tablet')) {
      device = 'Tablet';
    } else {
      device = 'Desktop';
    }
  }
  
  return {
    raw: ua,
    browser,
    os,
    device
  };
};

/**
 * 获取分页参数
 * @param {Request} req - Express请求对象
 * @param {Number} defaultPageSize - 默认每页记录数
 * @returns {Object} - 分页参数
 */
const getPagination = (req, defaultPageSize = 10) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || defaultPageSize;
  
  return {
    page: Math.max(1, page), // 页码至少为1
    pageSize: Math.min(100, Math.max(1, pageSize)), // 每页记录数在1-100之间
    skip: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, pageSize))
  };
};

module.exports = {
  getClientIP,
  getUserAgent,
  getPagination
};