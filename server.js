import express from 'express';
import sqlite3 from 'sqlite3';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';

// 加载环境变量 (.env 可选)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 检查是否在UI测试模式启动
const isTestMode = process.argv.includes('--test-ui') || process.argv.includes('--test-responsive');
if (isTestMode) {
  console.log('⚠️ 以UI测试模式启动服务器');
  console.log('📝 访问 http://localhost:' + PORT + '/ui-test.html 开始测试');
}

// 生产模式校验关键环境变量
if (process.env.NODE_ENV === 'production') {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'CHANGE_ME_TO_STRONG_SECRET') {
    console.warn('[安全警告] SESSION_SECRET 未设置或仍为默认值，请在生产环境中使用强随机值');
  }
}

// 确保数据目录存在
// 数据目录可通过环境变量覆盖，便于持久化挂载
const dataDir = process.env.DATA_DIR ? process.env.DATA_DIR : join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 确保上传目录存在
const uploadDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 静态托管上传文件
app.use('/uploads', express.static(uploadDir));

// Multer存储策略（根据类型子目录）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type } = req.params; // logo / seal / signature
    const subDir = join(uploadDir, type || 'misc');
    if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    const rand = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}_${rand}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('仅支持图片文件'));
    }
    cb(null, true);
  }
});

// 安全中间件与基础解析
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", 'data:', 'blob:'],
      // 允许内联样式（Element Plus + 动态注入），可逐步替换为哈希/nonce
      "style-src": ["'self'", "'unsafe-inline'", 'https:'],
      // 允许 blob: 脚本（若未来使用 worker，可保留），暂不开放 'unsafe-inline'
      "script-src": ["'self'", 'blob:'],
      // 若部署在 Render，需要允许同源即可，若有外部字体：
      "font-src": ["'self'", 'data:'],
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 动态 CORS （开发模式已在后面逻辑中设置，这里仅可选启用未来扩展）
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';


// Session配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'enterprise-secret-key-2024', // 建议 .env 中覆盖
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 4 * 60 * 60 * 1000, // 4小时，每天工作时间需重新登录一次
    httpOnly: true
  }
}));

// 登录接口限流（防暴力破解）
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过于频繁，请稍后再试' }
});

// SQLite数据库连接
const db = new sqlite3.Database(join(dataDir, 'app.db'), (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库');
    // 开启 WAL 模式提升并发与崩溃恢复能力
    db.run("PRAGMA journal_mode=WAL;", (e)=>{ if(e) console.warn('设置 WAL 失败:', e.message); });
    db.run("PRAGMA synchronous=NORMAL;", (e)=>{ if(e) console.warn('设置 synchronous 失败:', e.message); });
  }
});

// 初始化数据库表
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 用户表
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        department TEXT,
        is_active INTEGER DEFAULT 1,
        needs_password_reset INTEGER DEFAULT 0,
        password_updated_at DATETIME,
        last_active DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 客户表
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT, -- 旧字段(可能弃用)
        phone TEXT,
        email TEXT,
        address TEXT,
        note TEXT, -- 存储标签 JSON 数组
        status TEXT DEFAULT 'active',
        created_by INTEGER,
        registration_no TEXT, -- 新增 注册号
        tax_no TEXT,           -- 新增 税号
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`);  // 已移除deleted_at字段

      // 列存在性检测（对已存在旧表做增量）
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
          console.warn('获取 users 表结构失败:', err.message);
        } else {
          const colNames = rows.map(r => r.name);
          const userAlters = [];
          if (!colNames.includes('needs_password_reset')) userAlters.push('ALTER TABLE users ADD COLUMN needs_password_reset INTEGER DEFAULT 0');
            if (!colNames.includes('password_updated_at')) userAlters.push('ALTER TABLE users ADD COLUMN password_updated_at DATETIME');
            if (!colNames.includes('last_active')) userAlters.push('ALTER TABLE users ADD COLUMN last_active DATETIME');
          if (userAlters.length) {
            userAlters.forEach(sql => db.run(sql, e => e && console.warn('ALTER users 失败:', sql, e.message)));
          }
        }
      });
      db.all("PRAGMA table_info(customers)", (err, rows) => {
        if (err) {
          console.warn('获取 customers 表结构失败:', err.message);
          proceed();
          return;
        }
        const colNames = rows.map(r => r.name);
        const alters = [];
  if (!colNames.includes('registration_no')) alters.push('ALTER TABLE customers ADD COLUMN registration_no TEXT');
  if (!colNames.includes('tax_no')) alters.push('ALTER TABLE customers ADD COLUMN tax_no TEXT');
        if (alters.length === 0) return proceed();
        let done = 0;
        alters.forEach(sql => db.run(sql, (e)=>{
          if (e) console.warn('执行列添加失败:', sql, e.message);
          if (++done === alters.length) proceed();
        }));
      });

      function proceed(){
        // 创建默认管理员逻辑在后面 resolve
        // 这里不直接 resolve 由后续默认管理员检查分支处理
      }

      // 供应商表
      db.run(`CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT, -- 联系人
        phone TEXT,
        email TEXT,
        address TEXT,
        note TEXT, -- 存储标签 JSON 数组
        status TEXT DEFAULT 'active',
        created_by INTEGER,
        registration_no TEXT, -- 注册号
        tax_no TEXT, -- 税号
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`);  // 已移除deleted_at字段

      // 项目表
      db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        customer_id INTEGER,
        description TEXT,
        status TEXT DEFAULT 'planning',
        progress INTEGER DEFAULT 0,
        budget DECIMAL(10,2),
        start_date DATE,
        end_date DATE,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`);

      // 账套表
      db.run(`CREATE TABLE IF NOT EXISTS account_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        registration_number TEXT,
        tax_number TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        bank_name TEXT,
        bank_account TEXT,
        bank_name2 TEXT,
        bank_account2 TEXT,
        logo_path TEXT,
        seal_path TEXT,
        signature_path TEXT,
        is_active INTEGER DEFAULT 1,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`);

      // 打印模板表
      db.run(`CREATE TABLE IF NOT EXISTS print_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_set_id INTEGER,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        paper_size TEXT DEFAULT 'A4',
        content TEXT,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(account_set_id) REFERENCES account_sets(id)
      )`);

      // 编码规则表
      db.run(`CREATE TABLE IF NOT EXISTS code_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_set_id INTEGER,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        prefix TEXT,
        suffix TEXT,
        format TEXT,
        current_number INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(account_set_id) REFERENCES account_sets(id)
      )`);

      // 商品表
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        purchase_price DECIMAL(10,2) DEFAULT 0,
        selling_price DECIMAL(10,2) DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`);  // 移除account_set_id字段和外键，移除is_deleted字段
      
      // 业务员表
      db.run(`CREATE TABLE IF NOT EXISTS salespeople (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        status TEXT DEFAULT 'active',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`);  // 已移除deleted_at字段

      // 检查并创建默认管理员
      db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
          console.error('检查用户表失败:', err);
          reject(err);
          return;
        }
        
        if (row.count === 0) {
          const defaultPassword = bcrypt.hashSync('admin123', 10);
          db.run(
            "INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)",
            ['admin', defaultPassword, '系统管理员', 'admin'],
            function(err) {
              if (err) {
                console.error('创建默认管理员失败:', err);
                reject(err);
              } else {
                console.log('默认管理员已创建: admin / admin123');
                resolve();
              }
            }
          );
        } else {
          console.log('数据库已初始化，找到', row.count, '个用户');
          resolve();
        }
      });
    });
  });
}

// 用户活动跟踪中间件
const trackUserActivity = (req, res, next) => {
  if (req.session && req.session.userId) {
    // 更新用户最后活动时间
    db.run(
      "UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?",
      [req.session.userId],
      (err) => {
        if (err) console.error('更新用户活动时间失败:', err);
        // 继续处理请求，即使更新失败
        next();
      }
    );
  } else {
    next();
  }
};

// 认证中间件
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '请先登录' });
  }
  
  // 计算会话剩余时间（如果有）
  if (req.session.cookie && req.session.cookie.expires) {
    // 添加会话过期信息到请求对象，以便后续处理可以使用
    req.sessionExpiresAt = req.session.cookie.expires;
  }
  
  next();
};

// 应用用户活动跟踪中间件，在每个API请求中更新用户最后活动时间
app.use(trackUserActivity);

// 管理员权限中间件
const requireAdmin = (req, res, next) => {
  if (!req.session.userRole || req.session.userRole !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

// 简单弱密码检测：长度<8; 全相同字符; 递增/递减顺子 >=6; 常见弱口令
function isWeakPassword(pw) {
  if (!pw) return true;
  if (pw.length < 8) return true;
  const lower = pw.toLowerCase();
  const common = ['password','123456','12345678','123456789','qwerty','admin','111111','abc123','iloveyou'];
  if (common.includes(lower)) return true;
  // 全相同字符
  if (/^(.)\1+$/.test(pw)) return true;
  // 递增或递减顺子检测（数字或字母）
  const seq = 'abcdefghijklmnopqrstuvwxyz';
  const seqNum = '0123456789';
  const checkSequential = (s, minLen=6) => {
    for (let i=0;i<=s.length - minLen;i++) {
      const part = s.slice(i,i+minLen);
      if (seq.includes(part) || seqNum.includes(part)) return true;
      const rev = part.split('').reverse().join('');
      if (seq.includes(rev) || seqNum.includes(rev)) return true;
    }
    return false;
  };
  if (checkSequential(lower)) return true;
  return false;
}

// CORS 中间件（开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// 生产环境下托管静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, 'dist')));
  console.log('生产模式：托管 dist 静态文件');
} else {
  console.log('开发模式：请运行前端开发服务器 (npm run frontend)');
}

// 无论在什么环境，都托管根目录下的UI测试相关文件
app.use(express.static(__dirname, {
  index: false,  // 禁用目录索引
  // 只允许访问特定的测试文件
  setHeaders: (res, path) => {
    if (path.endsWith('ui-test.html') || path.endsWith('test-plan.md') || path.endsWith('ui-test-manual.md')) {
      res.set('Content-Type', path.endsWith('.md') ? 'text/markdown' : 'text/html');
    }
  }
}));

// ========== API 路由 ==========

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 认证路由
app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  db.get(
    "SELECT * FROM users WHERE username = ? AND is_active = 1",
    [username],
    (err, user) => {
      if (err) {
        console.error('登录查询失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }
      
      // 设置 session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userName = user.name;
      
      const forceChange = !!user.needs_password_reset || isWeakPassword(password);
      if (forceChange && !user.needs_password_reset) {
        db.run(`UPDATE users SET needs_password_reset = 1 WHERE id = ?`, [user.id]);
      }
      
      // 更新用户的最后活动时间
      db.run(`UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department,
          forcePasswordChange: forceChange
        }
      });
    }
  );
});

// 管理员重置用户密码（生成临时密码或指定）
app.post('/api/users/:id/reset-password', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  let { newPassword } = req.body || {};
  if (newPassword && isWeakPassword(newPassword)) {
    return res.status(400).json({ error: '新密码过于简单，请使用更复杂组合' });
  }
  if (!newPassword) {
    // 生成随机临时密码（12 位：字母数字）
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    newPassword = Array.from({length:12},()=>chars[Math.floor(Math.random()*chars.length)]).join('');
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.run(`UPDATE users SET password_hash = ?, needs_password_reset = 1, password_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hash, id], function(err){
    if (err) {
      console.error('重置密码失败:', err);
      return res.status(500).json({ error: '重置失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '用户不存在' });
    res.json({ success: true, tempPassword: newPassword });
  });
});

// 用户自行修改密码（例如强制修改流程）
app.post('/api/users/:id/change-password', requireAuth, (req, res) => {
  const { id } = req.params;
  const requester = req.session.userId;
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword) return res.status(400).json({ error: '新密码不能为空' });
  if (isWeakPassword(newPassword)) return res.status(400).json({ error: '新密码过于简单' });
  // 只有本人或管理员可改
  if (Number(id) !== requester && req.session.userRole !== 'admin') {
    return res.status(403).json({ error: '无权限修改该用户密码' });
  }
  db.get(`SELECT id, password_hash FROM users WHERE id = ?`, [id], (err, user) => {
    if (err) {
      console.error('查询用户失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (req.session.userRole !== 'admin') {
      if (!oldPassword || !bcrypt.compareSync(oldPassword, user.password_hash)) {
        return res.status(400).json({ error: '旧密码错误' });
      }
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.run(`UPDATE users SET password_hash = ?, needs_password_reset = 0, password_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hash, id], function(updErr){
      if (updErr) {
        console.error('更新密码失败:', updErr);
        return res.status(500).json({ error: '修改失败' });
      }
      res.json({ success: true });
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('退出登录失败:', err);
      return res.status(500).json({ error: '退出失败' });
    }
    res.json({ success: true });
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  db.get(
    "SELECT id, username, name, role, department, needs_password_reset, last_active FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err) {
        console.error('获取用户信息失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      // 检查是否需要强制修改密码（仅基于needs_password_reset标记）
      const forceChange = !!user.needs_password_reset;
      
      // 计算在线状态
      const now = new Date();
      const isOnline = user.last_active && (now - new Date(user.last_active) < 15 * 60 * 1000);
      
      // 去除敏感字段，然后添加forcePasswordChange标志和在线状态
      const { needs_password_reset, ...safeUser } = user;
      safeUser.forcePasswordChange = forceChange;
      safeUser.online = isOnline;
      safeUser.lastActiveTime = user.last_active;
      
      // 添加会话过期信息到响应
      const sessionInfo = {
        expiresAt: req.sessionExpiresAt || null,
        maxAge: req.session.cookie.maxAge,
        // 计算会话剩余时间（毫秒）
        remainingTime: req.sessionExpiresAt ? 
          Math.max(0, new Date(req.sessionExpiresAt) - now) : null
      };
      
      res.json({ 
        user: safeUser, 
        session: sessionInfo
      });
    }
  );
});

// 用户管理路由
app.get('/api/users', requireAuth, (req, res) => {
  db.all(
    "SELECT id, username, name, role, department, is_active, created_at, last_active FROM users ORDER BY created_at DESC",
    (err, rows) => {
      if (err) {
        console.error('获取用户列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      // 计算每个用户的在线状态
      const now = new Date();
      const users = rows.map(user => {
        // 如果用户在15分钟内有活动，则视为在线
        const isOnline = user.last_active && (now - new Date(user.last_active) < 15 * 60 * 1000);
        return {
          ...user,
          online: isOnline
        };
      });
      
      res.json(users);
    }
  );
});

app.post('/api/users', requireAuth, requireAdmin, (req, res) => {
  const { username, password, name, role, department } = req.body;
  
  if (!username || !password || !name) {
    return res.status(400).json({ error: '用户名、密码和姓名不能为空' });
  }
  
  // 先检查用户名是否已存在
  db.get("SELECT id FROM users WHERE username = ?", [username], (err, existingUser) => {
    if (err) {
      console.error('检查用户存在性失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    
    if (existingUser) {
      return res.status(400).json({ error: '用户名已存在，请选择其他用户名' });
    }
    
    // 用户名不存在，继续创建用户
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.run(
      "INSERT INTO users (username, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?)",
      [username, passwordHash, name, role || 'user', department || ''],
      function(err) {
        if (err) {
          console.error('创建用户失败:', err);
          return res.status(500).json({ error: '创建用户失败' });
        }
        
        res.json({ 
          id: this.lastID, 
          username, 
          name, 
          role: role || 'user', 
          department: department || '',
          is_active: 1
        });
      }
    );
  });
});

app.put('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const { name, role, department, is_active } = req.body;
  
  db.run(
    "UPDATE users SET name = ?, role = ?, department = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, role, department, is_active, userId],
    function(err) {
      if (err) {
        console.error('更新用户失败:', err);
        return res.status(500).json({ error: '更新用户失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      res.json({ success: true });
    }
  );
});

// 客户管理路由
app.get('/api/customers', requireAuth, (req, res) => {
  const { search, status } = req.query;
  let query = `
    SELECT c.*, u.name as creator_name 
    FROM customers c 
    LEFT JOIN users u ON c.created_by = u.id
  `;
  const params = [];
  
  const whereParts = [];
  if (search || status) {
    if (whereParts.length === 0) query += ' WHERE ';
    else query += ' WHERE ';
    const conditions = [];
    
    if (search) {
      conditions.push('(c.name LIKE ? OR c.contact LIKE ? OR c.phone LIKE ? OR c.registration_no LIKE ? OR c.tax_no LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }
    
    if (whereParts.length) conditions.unshift(whereParts.shift());
    query += conditions.join(' AND ');
  } else if (whereParts.length) {
    query += ' WHERE ' + whereParts.join(' AND ');
  }
  
  query += ' ORDER BY c.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('获取客户列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    const result = rows.map(r => {
      let tags = [];
      if (r.note) {
        try { const parsed = JSON.parse(r.note); if (Array.isArray(parsed)) tags = parsed; } catch {}
      }
      return { ...r, tags };
    });
    res.json(result);
  });
});

app.post('/api/customers', requireAuth, (req, res) => {
  let { name, registration_no, tax_no, phone, email, address, note, tags } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '客户名称不能为空' });
  }
  if (Array.isArray(tags)) {
    try { note = JSON.stringify(tags); } catch { note = '[]'; }
  } else if (note && typeof note !== 'string') {
    note = JSON.stringify(note);
  }
  db.run(
    `INSERT INTO customers (name, registration_no, tax_no, phone, email, address, note, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, registration_no || null, tax_no || null, phone || null, email || null, address || null, note || '[]', req.session.userId],
    function(err) {
      if (err) {
        console.error('创建客户失败:', err);
        return res.status(500).json({ error: '创建客户失败' });
      }
      res.json({ 
        id: this.lastID, 
        name, registration_no, tax_no, phone, email, address, note, tags: Array.isArray(tags)?tags:[],
        status: 'active'
      });
    }
  );
});

// 更新客户信息
app.put('/api/customers/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  let { name, registration_no, tax_no, phone, email, address, note, status, tags } = req.body;
  if (!name) return res.status(400).json({ error: '客户名称不能为空' });
  if (Array.isArray(tags)) {
    try { note = JSON.stringify(tags); } catch { note = '[]'; }
  } else if (note && typeof note !== 'string') {
    note = JSON.stringify(note);
  }
  const fields = ['name','registration_no','tax_no','phone','email','address','note'];
  const setParts = fields.map(f => `${f} = ?`);
  const params = [name, registration_no || null, tax_no || null, phone || null, email || null, address || null, note || null];
  if (status) { setParts.push('status = ?'); params.push(status); }
  setParts.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const sql = `UPDATE customers SET ${setParts.join(', ')} WHERE id = ?`;
  db.run(sql, params, function(err){
    if (err) {
      console.error('更新客户失败:', err);
      return res.status(500).json({ error: '更新客户失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '客户不存在' });
    res.json({ success: true });
  });
});

// 切换状态 active/inactive
app.patch('/api/customers/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active','inactive'].includes(status)) {
    return res.status(400).json({ error: '非法状态' });
  }
  db.run(`UPDATE customers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id], function(err){
    if (err) {
      console.error('更新状态失败:', err);
      return res.status(500).json({ error: '更新状态失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '客户不存在' });
    res.json({ success: true });
  });
});

// 删除客户 (物理删除)
app.delete('/api/customers/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // 直接物理删除
  db.run(`DELETE FROM customers WHERE id = ?`, [id], function(err){
    if (err) {
      console.error('删除客户失败:', err);
      return res.status(500).json({ error: '删除客户失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '客户不存在' });
    res.json({ success: true });
  });
});

// 已移除客户恢复路由

// 供应商管理路由
app.get('/api/suppliers', requireAuth, (req, res) => {
  const { search, status } = req.query;
  let query = `
    SELECT s.*, u.name as creator_name 
    FROM suppliers s 
    LEFT JOIN users u ON s.created_by = u.id
  `;
  const params = [];
  
  const whereParts = [];
  if (search || status) {
    if (whereParts.length === 0) query += ' WHERE ';
    else query += ' WHERE ';
    const conditions = [];
    
    if (search) {
      conditions.push('(s.name LIKE ? OR s.contact LIKE ? OR s.phone LIKE ? OR s.registration_no LIKE ? OR s.tax_no LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    
    if (whereParts.length) conditions.unshift(whereParts.shift());
    query += conditions.join(' AND ');
  } else if (whereParts.length) {
    query += ' WHERE ' + whereParts.join(' AND ');
  }
  
  query += ' ORDER BY s.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('获取供应商列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    const result = rows.map(r => {
      let tags = [];
      if (r.note) {
        try { const parsed = JSON.parse(r.note); if (Array.isArray(parsed)) tags = parsed; } catch {}
      }
      return { ...r, tags };
    });
    res.json(result);
  });
});

app.post('/api/suppliers', requireAuth, (req, res) => {
  let { name, registration_no, tax_no, phone, email, address, note, tags, contact } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '供应商名称不能为空' });
  }
  if (Array.isArray(tags)) {
    try { note = JSON.stringify(tags); } catch { note = '[]'; }
  } else if (note && typeof note !== 'string') {
    note = JSON.stringify(note);
  }
  db.run(
    `INSERT INTO suppliers (name, registration_no, tax_no, phone, email, address, note, contact, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, registration_no || null, tax_no || null, phone || null, email || null, address || null, note || '[]', contact || null, req.session.userId],
    function(err) {
      if (err) {
        console.error('创建供应商失败:', err);
        return res.status(500).json({ error: '创建供应商失败' });
      }
      res.json({ 
        id: this.lastID, 
        name, registration_no, tax_no, phone, email, address, note, contact, tags: Array.isArray(tags)?tags:[],
        status: 'active'
      });
    }
  );
});

// 更新供应商信息
app.put('/api/suppliers/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  let { name, registration_no, tax_no, phone, email, address, note, status, tags, contact } = req.body;
  if (!name) return res.status(400).json({ error: '供应商名称不能为空' });
  if (Array.isArray(tags)) {
    try { note = JSON.stringify(tags); } catch { note = '[]'; }
  } else if (note && typeof note !== 'string') {
    note = JSON.stringify(note);
  }
  const fields = ['name','registration_no','tax_no','phone','email','address','note','contact'];
  const setParts = fields.map(f => `${f} = ?`);
  const params = [name, registration_no || null, tax_no || null, phone || null, email || null, address || null, note || null, contact || null];
  if (status) { setParts.push('status = ?'); params.push(status); }
  setParts.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  const sql = `UPDATE suppliers SET ${setParts.join(', ')} WHERE id = ?`;
  db.run(sql, params, function(err){
    if (err) {
      console.error('更新供应商失败:', err);
      return res.status(500).json({ error: '更新供应商失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '供应商不存在' });
    res.json({ success: true });
  });
});

// 切换状态 active/inactive
app.patch('/api/suppliers/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active','inactive'].includes(status)) {
    return res.status(400).json({ error: '非法状态' });
  }
  db.run(`UPDATE suppliers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id], function(err){
    if (err) {
      console.error('更新状态失败:', err);
      return res.status(500).json({ error: '更新状态失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '供应商不存在' });
    res.json({ success: true });
  });
});

// 删除供应商 (物理删除)
app.delete('/api/suppliers/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // 直接物理删除
  db.run(`DELETE FROM suppliers WHERE id = ?`, [id], function(err){
    if (err) {
      console.error('删除供应商失败:', err);
      return res.status(500).json({ error: '删除供应商失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '供应商不存在' });
    res.json({ success: true });
  });
});

// 已移除供应商恢复路由

// 业务员管理路由
app.get('/api/salespeople', requireAuth, (req, res) => {
  const { search, status } = req.query;
  let query = `
    SELECT s.*, u.name as creator_name 
    FROM salespeople s 
    LEFT JOIN users u ON s.created_by = u.id
  `;
  const params = [];
  
  if (search || status) {
    const conditions = []; 
    
    if (search) {
      conditions.push('(s.nickname LIKE ? OR s.name LIKE ? OR s.phone LIKE ? OR s.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
  }
  
  query += ' ORDER BY s.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('获取业务员列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

app.post('/api/salespeople', requireAuth, (req, res) => {
  let { nickname, name, phone, email } = req.body;
  
  if (!nickname || !name) {
    return res.status(400).json({ error: '业务员简称和名称不能为空' });
  }
  
  db.run(
    `INSERT INTO salespeople (nickname, name, phone, email, created_by) 
     VALUES (?, ?, ?, ?, ?)`,
    [nickname, name, phone || null, email || null, req.session.userId],
    function(err) {
      if (err) {
        console.error('创建业务员失败:', err);
        return res.status(500).json({ error: '创建业务员失败' });
      }
      res.json({ 
        id: this.lastID, 
        nickname, name, phone, email, 
        status: 'active'
      });
    }
  );
});

app.put('/api/salespeople/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  let { nickname, name, phone, email, status } = req.body;
  
  if (!nickname || !name) {
    return res.status(400).json({ error: '业务员简称和名称不能为空' });
  }
  
  const fields = ['nickname', 'name', 'phone', 'email'];
  const setParts = fields.map(f => `${f} = ?`);
  const params = [nickname, name, phone || null, email || null];
  
  if (status) { 
    setParts.push('status = ?'); 
    params.push(status); 
  }
  
  setParts.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  const sql = `UPDATE salespeople SET ${setParts.join(', ')} WHERE id = ?`;
  
  db.run(sql, params, function(err){
    if (err) {
      console.error('更新业务员失败:', err);
      return res.status(500).json({ error: '更新业务员失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '业务员不存在' });
    res.json({ success: true });
  });
});

app.patch('/api/salespeople/:id/status', requireAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['active','inactive'].includes(status)) {
    return res.status(400).json({ error: '非法状态' });
  }
  
  db.run(`UPDATE salespeople SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id], function(err){
    if (err) {
      console.error('更新业务员状态失败:', err);
      return res.status(500).json({ error: '更新状态失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '业务员不存在' });
    res.json({ success: true });
  });
});

app.delete('/api/salespeople/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  
  // 直接物理删除
  db.run(`DELETE FROM salespeople WHERE id = ?`, [id], function(err){
    if (err) {
      console.error('删除业务员失败:', err);
      return res.status(500).json({ error: '删除业务员失败' });
    }
    if (this.changes === 0) return res.status(404).json({ error: '业务员不存在' });
    res.json({ success: true });
  });
});

// 项目管理路由
app.get('/api/projects', requireAuth, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT p.*, c.name as customer_name, u.name as creator_name 
    FROM projects p 
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN users u ON p.created_by = u.id
  `;
  const params = [];
  
  if (status) {
    query += ' WHERE p.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY p.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('获取项目列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

// ========== 账套管理路由 ==========

app.get('/api/account-sets', requireAuth, (req, res) => {
  db.all(`
    SELECT a.*, u.name as creator_name 
    FROM account_sets a 
    LEFT JOIN users u ON a.created_by = u.id
    ORDER BY a.created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('获取账套列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

app.post('/api/account-sets', requireAuth, (req, res) => {
  const {
    name, registration_number, tax_number, phone, email, address,
    bank_name, bank_account, bank_name2, bank_account2
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '账套名称不能为空' });
  }
  
  // 自动生成账套代码（名称首字母大写 + 2位数字）
  const namePrefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  const randomNum = Math.floor(Math.random() * 90 + 10); // 10-99
  
  const code = `${namePrefix}${randomNum}`;
  
  db.run(
    `INSERT INTO account_sets 
     (name, code, registration_number, tax_number, phone, email, address, 
      bank_name, bank_account, bank_name2, bank_account2, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, code, registration_number, tax_number, phone, email, address,
     bank_name, bank_account, bank_name2, bank_account2, req.session.userId],
    function(err) {
      if (err) {
        console.error('创建账套失败:', err);
        return res.status(500).json({ error: '创建账套失败' });
      }
      
      res.json({ 
        id: this.lastID, 
        name, code, registration_number, tax_number, phone, email, address,
        bank_name, bank_account, bank_name2, bank_account2,
        is_active: 1
      });
    }
  );
});

app.put('/api/account-sets/:id', requireAuth, (req, res) => {
  const accountSetId = req.params.id;
  const {
    name, registration_number, tax_number, phone, email, address,
    bank_name, bank_account, bank_name2, bank_account2, is_active
  } = req.body;
  
  db.run(
    `UPDATE account_sets 
     SET name = ?, registration_number = ?, tax_number = ?, phone = ?, email = ?, address = ?,
         bank_name = ?, bank_account = ?, bank_name2 = ?, bank_account2 = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, registration_number, tax_number, phone, email, address,
     bank_name, bank_account, bank_name2, bank_account2, is_active, accountSetId],
    function(err) {
      if (err) {
        console.error('更新账套失败:', err);
        return res.status(500).json({ error: '更新账套失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '账套不存在' });
      }
      
      res.json({ success: true });
    }
  );
});

// 文件上传路由（LOGO、印章、签名）- 简化版
app.post('/api/upload/:type', requireAuth, upload.single('file'), (req, res) => {
  const { type } = req.params; // logo, seal, signature
  const { account_set_id } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: '未接收到文件' });
  }
  if (!account_set_id) {
    return res.status(400).json({ error: '缺少 account_set_id' });
  }
  const relativePath = `/uploads/${type}/${req.file.filename}`;
  const field = `${type}_path`;
  db.run(`UPDATE account_sets SET ${field} = ? WHERE id = ?`, [relativePath, account_set_id], function(err) {
    if (err) {
      console.error('更新文件路径失败:', err);
      return res.status(500).json({ error: '文件上传失败' });
    }
    res.json({ success: true, file_path: relativePath });
  });
});

// 打印模板管理
app.get('/api/print-templates', requireAuth, (req, res) => {
  const { account_set_id } = req.query;
  
  db.all(
    `SELECT * FROM print_templates WHERE account_set_id = ? ORDER BY created_at DESC`,
    [account_set_id],
    (err, rows) => {
      if (err) {
        console.error('获取打印模板失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/print-templates', requireAuth, (req, res) => {
  const { account_set_id, name, type, paper_size, content, is_default } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: '模板名称和类型不能为空' });
  }
  
  // 如果设置为默认模板，先取消其他同类型模板的默认状态
  if (is_default) {
    db.run(
      `UPDATE print_templates SET is_default = 0 WHERE account_set_id = ? AND type = ?`,
      [account_set_id, type],
      (err) => {
        if (err) {
          console.error('更新默认模板状态失败:', err);
        }
      }
    );
  }
  
  db.run(
    `INSERT INTO print_templates (account_set_id, name, type, paper_size, content, is_default) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [account_set_id, name, type, paper_size, content, is_default ? 1 : 0],
    function(err) {
      if (err) {
        console.error('创建打印模板失败:', err);
        return res.status(500).json({ error: '创建模板失败' });
      }
      res.json({ 
        id: this.lastID, 
        name, type, paper_size, content, 
        is_default: is_default ? 1 : 0 
      });
    }
  );
});

app.put('/api/print-templates/:id', requireAuth, (req, res) => {
  const templateId = req.params.id;
  const { name, type, paper_size, content, is_default } = req.body;
  
  // 如果设置为默认模板，先取消其他同类型模板的默认状态
  if (is_default) {
    db.get(
      `SELECT account_set_id, type FROM print_templates WHERE id = ?`,
      [templateId],
      (err, template) => {
        if (err) {
          console.error('获取模板信息失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        
        if (template) {
          db.run(
            `UPDATE print_templates SET is_default = 0 WHERE account_set_id = ? AND type = ? AND id != ?`,
            [template.account_set_id, template.type, templateId],
            (err) => {
              if (err) {
                console.error('更新默认模板状态失败:', err);
              }
            }
          );
        }
      }
    );
  }
  
  db.run(
    `UPDATE print_templates SET name = ?, type = ?, paper_size = ?, content = ?, is_default = ? WHERE id = ?`,
    [name, type, paper_size, content, is_default ? 1 : 0, templateId],
    function(err) {
      if (err) {
        console.error('更新打印模板失败:', err);
        return res.status(500).json({ error: '更新模板失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '模板不存在' });
      }
      
      res.json({ success: true });
    }
  );
});

app.delete('/api/print-templates/:id', requireAuth, (req, res) => {
  const templateId = req.params.id;
  
  db.run(
    `DELETE FROM print_templates WHERE id = ?`,
    [templateId],
    function(err) {
      if (err) {
        console.error('删除打印模板失败:', err);
        return res.status(500).json({ error: '删除模板失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '模板不存在' });
      }
      
      res.json({ success: true });
    }
  );
});

// 编码规则管理
app.get('/api/code-rules', requireAuth, (req, res) => {
  const { account_set_id } = req.query;
  
  db.all(
    `SELECT * FROM code_rules WHERE account_set_id = ? ORDER BY created_at DESC`,
    [account_set_id],
    (err, rows) => {
      if (err) {
        console.error('获取编码规则失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/code-rules', requireAuth, (req, res) => {
  const { account_set_id, name, type, prefix, suffix, format, current_number } = req.body;
  
  if (!name || !type || !format) {
    return res.status(400).json({ error: '规则名称、类型和格式不能为空' });
  }
  
  db.run(
    `INSERT INTO code_rules (account_set_id, name, type, prefix, suffix, format, current_number) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [account_set_id, name, type, prefix, suffix, format, current_number || 0],
    function(err) {
      if (err) {
        console.error('创建编码规则失败:', err);
        return res.status(500).json({ error: '创建编码规则失败' });
      }
      res.json({ 
        id: this.lastID, 
        name, type, prefix, suffix, format, 
        current_number: current_number || 0 
      });
    }
  );
});

app.put('/api/code-rules/:id', requireAuth, (req, res) => {
  const ruleId = req.params.id;
  const { name, type, prefix, suffix, format, current_number } = req.body;
  
  db.run(
    `UPDATE code_rules SET name = ?, type = ?, prefix = ?, suffix = ?, format = ?, current_number = ? WHERE id = ?`,
    [name, type, prefix, suffix, format, current_number, ruleId],
    function(err) {
      if (err) {
        console.error('更新编码规则失败:', err);
        return res.status(500).json({ error: '更新编码规则失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '编码规则不存在' });
      }
      
      res.json({ success: true });
    }
  );
});

app.delete('/api/code-rules/:id', requireAuth, (req, res) => {
  const ruleId = req.params.id;
  
  db.run(
    `DELETE FROM code_rules WHERE id = ?`,
    [ruleId],
    function(err) {
      if (err) {
        console.error('删除编码规则失败:', err);
        return res.status(500).json({ error: '删除编码规则失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '编码规则不存在' });
      }
      
      res.json({ success: true });
    }
  );
});

// 生成编码
app.post('/api/generate-code', requireAuth, (req, res) => {
  const { rule_id } = req.body;
  
  db.get(`SELECT * FROM code_rules WHERE id = ?`, [rule_id], (err, rule) => {
    if (err || !rule) {
      return res.status(400).json({ error: '编码规则不存在' });
    }
    
    // 更新当前编号
    const newNumber = rule.current_number + 1;
    db.run(
      `UPDATE code_rules SET current_number = ? WHERE id = ?`,
      [newNumber, rule_id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '生成编码失败' });
        }
        
        // 根据格式生成编码
        let generatedCode = rule.format
          .replace('{prefix}', rule.prefix || '')
          .replace('{suffix}', rule.suffix || '')
          .replace('{number}', newNumber.toString().padStart(4, '0'))
          .replace('{year}', new Date().getFullYear().toString())
          .replace('{month}', (new Date().getMonth() + 1).toString().padStart(2, '0'))
          .replace('{day}', new Date().getDate().toString().padStart(2, '0'))
          .replace('{hour}', new Date().getHours().toString().padStart(2, '0'))
          .replace('{minute}', new Date().getMinutes().toString().padStart(2, '0'));
        
        res.json({ code: generatedCode, rule_id, current_number: newNumber });
      }
    );
  });
});

// 商品管理API
app.get('/api/products', requireAuth, (req, res) => {
  const { search } = req.query;
  
  let query = `
    SELECT p.*, u.name as creator_name 
    FROM products p 
    LEFT JOIN users u ON p.created_by = u.id
  `;
  const params = [];
  
  if (search) {
    query += ' AND (p.code LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY p.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('获取商品列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

app.post('/api/products', requireAuth, (req, res) => {
  const { description, purchase_price, selling_price } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: '商品描述不能为空' });
  }
  
  // 生成9位随机商品编码
  const generateRandomCode = () => {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      code += digits[Math.floor(Math.random() * 10)];
    }
    return code;
  };
  
  // 尝试生成唯一编码，最多尝试10次
  const tryGenerateUniqueCode = (attempt = 0) => {
    if (attempt >= 10) {
      return res.status(500).json({ error: '无法生成唯一商品编码，请稍后再试' });
    }
    
    const code = generateRandomCode();
    
    // 检查编码是否已存在
    db.get('SELECT id FROM products WHERE code = ?', [code], (err, existing) => {
      if (err) {
        console.error('检查商品编码失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      if (existing) {
        // 编码已存在，重试
        return tryGenerateUniqueCode(attempt + 1);
      }
      
      // 插入新商品
      db.run(
        `INSERT INTO products (code, description, purchase_price, selling_price, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [code, description, purchase_price || 0, selling_price || 0, req.session.userId],
        function(err) {
          if (err) {
            console.error('创建商品失败:', err);
            return res.status(500).json({ error: '创建商品失败' });
          }
          
          res.json({ 
            id: this.lastID, 
            code,
            description, 
            purchase_price: purchase_price || 0,
            selling_price: selling_price || 0,
            created_by: req.session.userId
          });
        }
      );
    });
  };
  
  // 开始尝试生成唯一编码
  tryGenerateUniqueCode();
});

app.put('/api/products/:id', requireAuth, (req, res) => {
  const productId = req.params.id;
  const { description, purchase_price, selling_price } = req.body;
  
  if (!description) {
    return res.status(400).json({ error: '商品描述不能为空' });
  }
  
  db.run(
    `UPDATE products 
     SET description = ?, purchase_price = ?, selling_price = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [description, purchase_price || 0, selling_price || 0, productId],
    function(err) {
      if (err) {
        console.error('更新商品失败:', err);
        return res.status(500).json({ error: '更新商品失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '商品不存在或已被删除' });
      }
      
      res.json({ success: true });
    }
  );
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
  const productId = req.params.id;
  
  // 直接物理删除
  db.run(
    `DELETE FROM products WHERE id = ?`,
    [productId],
    function(err) {
      if (err) {
        console.error('删除商品失败:', err);
        return res.status(500).json({ error: '删除商品失败' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '商品不存在' });
      }
      
      res.json({ success: true });
    }
  );
});

// 仪表板数据
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  const stats = {};
  
  // 获取客户数量
  db.get("SELECT COUNT(*) as count FROM customers WHERE status = 'active'", (err, row) => {
    if (err) {
      console.error('获取客户统计失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    stats.customers = row.count;
    
    // 获取项目数量
    db.get("SELECT COUNT(*) as count FROM projects", (err, row) => {
      if (err) {
        console.error('获取项目统计失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      stats.projects = row.count;
      
      // 获取进行中项目数量
      db.get("SELECT COUNT(*) as count FROM projects WHERE status = 'active'", (err, row) => {
        if (err) {
          console.error('获取进行中项目统计失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        stats.activeProjects = row.count;
        
        // 获取用户数量
        db.get("SELECT COUNT(*) as count FROM users WHERE is_active = 1", (err, row) => {
          if (err) {
            console.error('获取用户统计失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }
          stats.users = row.count;
          
          // 获取账套数量
          db.get("SELECT COUNT(*) as count FROM account_sets WHERE is_active = 1", (err, row) => {
            if (err) {
              console.error('获取账套统计失败:', err);
              return res.status(500).json({ error: '服务器错误' });
            }
            stats.accountSets = row.count;
            
            // 获取商品数量
            db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
              if (err) {
                console.error('获取商品统计失败:', err);
                return res.status(500).json({ error: '服务器错误' });
              }
              stats.products = row.count;
              
              res.json(stats);
            });
          });
        });
      });
    });
  });
});

// 通配符路由 - 返回前端应用（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
} else {
  // 开发环境下的根路径提示
  app.get('/', (req, res) => {
    res.json({ 
      message: '企业管理系统后端 API 服务运行中',
      environment: 'development',
      frontend: '请运行 npm run client 启动前端开发服务器',
      endpoints: {
        auth: '/api/login, /api/logout, /api/me',
        users: '/api/users',
        customers: '/api/customers',
        suppliers: '/api/suppliers',
        projects: '/api/projects',
        account_sets: '/api/account-sets',
        print_templates: '/api/print-templates',
        code_rules: '/api/code-rules',
        products: '/api/products',
        dashboard: '/api/dashboard/stats'
      }
    });
  });
}

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 发票API路由
try {
  const invoicesRoutesModule = await import('./routes/invoices.js');
  const invoicesRoutes = invoicesRoutesModule.default;
  app.use('/api/invoices', invoicesRoutes);
  console.log('发票管理API路由已加载');
} catch (error) {
  console.error('加载发票路由失败:', error);
}

// 初始化数据库并启动服务器
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`企业管理系统后端服务运行在 http://localhost:${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`前端开发服务器请运行: npm run client`);
        console.log(`默认管理员账号: admin / admin123`);
      }
    });
  })
  .catch((err) => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});

// 在文件上传路由后添加删除API
app.delete('/api/upload/:type', requireAuth, express.json(), (req, res) => {
  const { type } = req.params;
  const { account_set_id, file_path } = req.body;
  const field = `${type}_path`;
  db.get(`SELECT ${field} FROM account_sets WHERE id = ?`, [account_set_id], (err, row) => {
    if (err) {
      console.error('查询素材失败:', err);
      return res.status(500).json({ error: '删除素材失败' });
    }
    const currentPath = row?.[field];
    db.run(`UPDATE account_sets SET ${field} = NULL WHERE id = ?`, [account_set_id], function(uErr) {
      if (uErr) {
        console.error('删除素材失败:', uErr);
        return res.status(500).json({ error: '删除素材失败' });
      }
      // 删除文件（忽略错误）
      if (currentPath) {
        const absPath = join(__dirname, currentPath.replace('/uploads', 'uploads'));
        fs.unlink(absPath, () => {});
      }
      res.json({ success: true });
    });
  });
});

export default app;