/**
 * Express应用入口文件
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// 导入配置
const config = require('./config/app.config');
const db = require('./config/db.config');

// 创建Express应用
const app = express();

// 创建日志目录
const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// 创建访问日志流
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

// 设置安全相关的HTTP头
app.use(helmet());

// 启用GZIP压缩
app.use(compression());

// 启用CORS
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 3600
}));

// 请求日志记录
app.use(morgan('combined', { stream: accessLogStream }));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态资源
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API路由
const apiRoutes = require('./routes/api.routes');
app.use('/api', apiRoutes);

// 404处理
app.use((req, res, next) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    data: null
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('应用错误:', err);
  
  // 区分开发环境和生产环境的错误响应
  const errorMessage = config.nodeEnv === 'development' 
    ? err.message 
    : '服务器内部错误';
  
  const errorDetails = config.nodeEnv === 'development' 
    ? err.stack 
    : null;
  
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: errorMessage,
    error: errorDetails,
    data: null
  });
});

// 连接数据库
db.connect()
  .then(() => {
    // 启动服务器
    const PORT = config.port || 3000;
    app.listen(PORT, () => {
      console.log(`服务器已启动, 监听端口: ${PORT}`);
      console.log(`运行环境: ${config.nodeEnv}`);
    });
  })
  .catch(error => {
    console.error('数据库连接失败:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM 信号接收, 关闭HTTP服务器');
  db.disconnect()
    .then(() => {
      console.log('数据库连接已关闭');
      process.exit(0);
    })
    .catch(err => {
      console.error('关闭数据库连接时出错:', err);
      process.exit(1);
    });
});

module.exports = app;