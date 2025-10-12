// 配置文件 - 存储环境变量和API设置
// 注意: 不要在生产环境直接暴露敏感信息

export const config = {
  // API基础URL
  apiBaseUrl: '/api',
  
  // 开发环境数据库配置（仅供开发使用）
  development: {
    databaseUrl: 'postgresql://postgres:GvDViOFhACSKomPtKqKnqxqUIHiAHbnP@postgres.railway.internal:5432/railway',
  },
  
  // 当前环境
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}

// 获取当前环境的配置
export function getEnvironmentConfig() {
  return config.isDevelopment ? config.development : {};
}

// 仅导出安全的配置信息供前端使用
export const publicConfig = {
  apiBaseUrl: config.apiBaseUrl,
};