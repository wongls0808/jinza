require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 鉴权中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({
    code: 401,
    message: '未授权访问',
    data: null
  });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({
      code: 403,
      message: '无效或过期的令牌',
      data: null
    });
    
    req.user = user;
    next();
  });
};

// 模拟数据
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    nickname: '管理员',
    email: 'admin@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    role: 'admin',
    status: 1,
    lastLoginTime: '2025-09-26 08:30:00'
  }
];

const categories = [
  {
    id: 1,
    name: '新闻',
    parentId: 0,
    sort: 1,
    status: 1,
    description: '新闻资讯分类',
    children: [
      {
        id: 3,
        name: '行业新闻',
        parentId: 1,
        sort: 1,
        status: 1,
        description: '行业相关新闻'
      },
      {
        id: 4,
        name: '公司新闻',
        parentId: 1,
        sort: 2,
        status: 1,
        description: '公司相关新闻'
      }
    ]
  },
  {
    id: 2,
    name: '产品',
    parentId: 0,
    sort: 2,
    status: 1,
    description: '产品相关分类'
  }
];

// 路由
// 健康检查 - 同时支持根路径、/health和/api/health
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.status(200).json({
    code: 200,
    message: 'Server is running',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      code: 401,
      message: '用户名或密码错误',
      data: null
    });
  }
  
  // 生成JWT令牌
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // 不返回密码
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: userWithoutPassword
    }
  });
});

// 获取用户信息
app.get('/api/user/info', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({
      code: 404,
      message: '用户不存在',
      data: null
    });
  }
  
  // 不返回密码
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    code: 200,
    message: '获取成功',
    data: userWithoutPassword
  });
});

// 获取分类列表
app.get('/api/categories', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: categories
  });
});

// 服务启动
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});