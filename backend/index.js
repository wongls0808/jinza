import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 简单账套本地存储（JSON文件模拟数据库）
// 把文件路径保存在 globalThis 上以避免模块被多次加载时重复声明块级常量导致的错误
var ACCOUNTS_FILE = globalThis.__ACCOUNTS_FILE || (globalThis.__ACCOUNTS_FILE = path.join(process.cwd(), 'accounts.json'));
function readAccounts() {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      fs.writeFileSync(ACCOUNTS_FILE, '[]', 'utf-8');
      return [];
    }
    const content = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('读取账套数据失败:', e);
    return [];
  }
}
function writeAccounts(data) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('写入账套数据失败:', e);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 静态资源托管
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('不支持的文件类型'))
  }
});

// 上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  const url = `/uploads/${req.file.filename}`;
  const name = req.file.originalname || req.file.filename
  res.json({ url, name });
});

// Multer 错误处理中间件
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err)
    return res.status(400).json({ error: err.message })
  }
  if (err) {
    console.error('Unexpected error:', err)
    return res.status(500).json({ error: err.message || '服务器错误' })
  }
  next()
})

// 获取所有账套
app.get('/api/accounts', (req, res) => {
  res.json(readAccounts())
})

// 新增账套
app.post('/api/accounts', (req, res) => {
  const accounts = readAccounts()
  const id = Date.now().toString()
  const account = { ...req.body, id }
  accounts.push(account)
  writeAccounts(accounts)
  res.json(account)
})

// 更新账套
app.put('/api/accounts/:id', (req, res) => {
  const accounts = readAccounts()
  const idx = accounts.findIndex(a => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: '账套不存在' })
  accounts[idx] = { ...accounts[idx], ...req.body }
  writeAccounts(accounts)
  res.json(accounts[idx])
})

// 删除账套
app.delete('/api/accounts/:id', (req, res) => {
  let accounts = readAccounts()
  const idx = accounts.findIndex(a => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: '账套不存在' })
  accounts.splice(idx, 1)
  writeAccounts(accounts)
  res.json({ success: true })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
