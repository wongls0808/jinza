// 简单账套本地存储（JSON文件模拟数据库）
const ACCOUNTS_FILE = path.join(process.cwd(), 'accounts.json')
function readAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) return []
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'))
}
function writeAccounts(data) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

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

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
    if (file.mimetype === 'image/png') cb(null, true);
    else cb(new Error('仅支持PNG格式'));
  }
});

// 上传接口
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
