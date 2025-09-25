/**
 * 应用配置
 */
module.exports = {
  app: {
    port: process.env.PORT || 8080,
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    apiPrefix: '/api'
  }
};