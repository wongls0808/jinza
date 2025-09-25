/**
 * 数据库配置
 */
module.exports = {
  // 实际应用中这里应该使用环境变量配置数据库连接信息
  // 当前为模拟数据，不使用实际数据库
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'jinza_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  }
};