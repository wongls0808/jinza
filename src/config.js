// 前端运行时可见的配置（严禁在此文件中放置任何凭据/连接串等敏感信息）
// API 基础路径由前端使用；其余敏感配置必须通过服务端环境变量提供

export const config = {
  apiBaseUrl: '/api',
  isDevelopment: import.meta.env?.DEV ?? false,
  isProduction: import.meta.env?.PROD ?? false,
}

// 向应用公开的安全配置
export const publicConfig = {
  apiBaseUrl: config.apiBaseUrl,
}

// 兼容旧代码：不再暴露任何与数据库相关的信息
export function getEnvironmentConfig() {
  return {}
}