const express = require('express');
const router = express.Router();
const tenantsController = require('../controllers/tenants.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 简单的本地文件存储
const uploadDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`创建上传目录成功: ${uploadDir}`);
  }
} catch (err) {
  console.error(`创建上传目录失败: ${err.message}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png') {
      return cb(new Error('仅支持 PNG 格式'));
    }
    cb(null, true);
  }
});

// Tenants CRUD
router.get('/', tenantsController.getTenants);
router.get('/:id', tenantsController.getTenantById);
router.post('/', tenantsController.createTenant);
router.put('/:id', tenantsController.updateTenant);
router.delete('/:id', tenantsController.deleteTenant);

// Upload endpoint
router.post('/uploads', (req, res, next) => {
  try {
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('文件上传错误:', err);
        return res.status(400).json({ code: 400, message: err.message || '文件上传失败', data: null });
      }
      
      if (!req.file) {
        return res.status(400).json({ code: 400, message: '未上传文件', data: null });
      }
      
      const url = `/uploads/${req.file.filename}`;
      res.json({ code: 200, message: '上传成功', data: { url, mimetype: req.file.mimetype } });
    });
  } catch (error) {
    console.error('上传处理错误:', error);
    next(error);
  }
});

module.exports = router;
