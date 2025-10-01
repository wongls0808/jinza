import express from 'express';
import sqlite3 from 'sqlite3';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 确保数据目录存在
const dataDir = join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'enterprise-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    httpOnly: true
  }
}));

// SQLite数据库连接
const db = new sqlite3.Database(join(dataDir, 'app.db'), (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库');
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // 客户表
      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        note TEXT,
        status TEXT DEFAULT 'active',
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )`);

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

// 认证中间件
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '请先登录' });
  }
  next();
};

// 管理员权限中间件
const requireAdmin = (req, res, next) => {
  if (!req.session.userRole || req.session.userRole !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

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
  console.log('开发模式：请运行前端开发服务器 (npm run client)');
}

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
app.post('/api/login', (req, res) => {
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
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          department: user.department
        }
      });
    }
  );
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
    "SELECT id, username, name, role, department FROM users WHERE id = ?",
    [req.session.userId],
    (err, user) => {
      if (err) {
        console.error('获取用户信息失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.json({ user });
    }
  );
});

// 用户管理路由
app.get('/api/users', requireAuth, (req, res) => {
  db.all(
    "SELECT id, username, name, role, department, is_active, created_at FROM users ORDER BY created_at DESC",
    (err, rows) => {
      if (err) {
        console.error('获取用户列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.json(rows);
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
  
  if (search || status) {
    query += ' WHERE ';
    const conditions = [];
    
    if (search) {
      conditions.push('(c.name LIKE ? OR c.contact LIKE ? OR c.phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }
    
    query += conditions.join(' AND ');
  }
  
  query += ' ORDER BY c.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('获取客户列表失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
    res.json(rows);
  });
});

app.post('/api/customers', requireAuth, (req, res) => {
  const { name, contact, phone, email, address, note } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '客户名称不能为空' });
  }
  
  db.run(
    "INSERT INTO customers (name, contact, phone, email, address, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, contact, phone, email, address, note, req.session.userId],
    function(err) {
      if (err) {
        console.error('创建客户失败:', err);
        return res.status(500).json({ error: '创建客户失败' });
      }
      
      res.json({ 
        id: this.lastID, 
        name, contact, phone, email, address, note,
        status: 'active'
      });
    }
  );
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
app.post('/api/upload/:type', requireAuth, (req, res) => {
  const { type } = req.params; // logo, seal, signature
  const { account_set_id } = req.body;
  
  // 模拟文件上传成功，返回模拟的文件路径
  const filePath = `/uploads/${type}_${account_set_id}_${Date.now()}.png`;
  
  // 更新账套的文件路径
  const field = `${type}_path`;
  db.run(
    `UPDATE account_sets SET ${field} = ? WHERE id = ?`,
    [filePath, account_set_id],
    function(err) {
      if (err) {
        console.error('更新文件路径失败:', err);
        return res.status(500).json({ error: '文件上传失败' });
      }
      res.json({ success: true, file_path: filePath });
    }
  );
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
            
            res.json(stats);
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
        projects: '/api/projects',
        account_sets: '/api/account-sets',
        print_templates: '/api/print-templates',
        code_rules: '/api/code-rules',
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
app.delete('/api/upload/:type', requireAuth, (req, res) => {
  const { type } = req.params; // logo, seal, signature
  const { account_set_id } = req.body;
  
  // 清空对应的素材路径
  const field = `${type}_path`;
  db.run(
    `UPDATE account_sets SET ${field} = NULL WHERE id = ?`,
    [account_set_id],
    function(err) {
      if (err) {
        console.error('删除素材失败:', err);
        return res.status(500).json({ error: '删除素材失败' });
      }
      res.json({ success: true });
    }
  );
});

export default app;