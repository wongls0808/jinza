import express from 'express'
import 'express-async-errors'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { router as apiRouter } from './src/server/routes.js'
import { ensureSchema, seedInitialAdmin } from './src/server/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// CORS: 开发放开，生产按环境变量白名单控制（逗号分隔 ORIGINS）；默认不宽松放行
const allowOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true) // same-origin / curl
    if (process.env.NODE_ENV !== 'production') return cb(null, true)
    if (allowOrigins.length > 0 && allowOrigins.includes(origin)) return cb(null, true)
    return cb(new Error('CORS not allowed'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// 信任反向代理（获取真实 IP 用于审计/限流）
try { app.set('trust proxy', 1) } catch {}

// 基础安全响应头（不引入依赖，避免破坏构建）
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  next()
})

// Serve runtime uploads (e.g., bank logos) — use persistent DATA_DIR when available
const dataDir = process.env.DATA_DIR || path.join(__dirname)
const uploadsPath = path.join(dataDir, 'uploads')
if (!fs.existsSync(uploadsPath)) {
  try { fs.mkdirSync(uploadsPath, { recursive: true }) } catch {}
}
console.log('[static] DATA_DIR=', dataDir, 'uploadsPath=', uploadsPath)
app.use('/uploads', express.static(uploadsPath))

// Serve /banks from project public folder so uploaded bank logos are available immediately
try {
  const banksDir = path.join(__dirname, 'public', 'banks')
  if (!fs.existsSync(banksDir)) {
    try { fs.mkdirSync(banksDir, { recursive: true }) } catch {}
  }
  app.use('/banks', express.static(banksDir))
  console.log('[static] banksDir=', banksDir)
} catch {}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// API routes
app.use('/api', apiRouter)

// Serve built front-end when dist exists or in production (for PaaS like Render)
const distPath = path.join(__dirname, 'dist')
const shouldServeStatic = fs.existsSync(distPath) || process.env.NODE_ENV === 'production'
if (shouldServeStatic) {
  // 写入版本文件（非关键路径，容错）
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))
    const verText = `version=${pkg.version || '0.0.0'}\nsha=${process.env.GIT_SHA || 'unknown'}\ntime=${new Date().toISOString()}\n`
    fs.writeFileSync(path.join(distPath, 'version.txt'), verText)
  } catch {}
  // Static assets caching strategy:
  // - index.html: no-store,确保客户端总是获取最新入口，避免旧 index 引用新 chunk 导致运行时报错
  // - 带哈希的静态资源(js/css/fonts/images)：immutable 长缓存
  app.use(express.static(distPath, {
    maxAge: 0,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-store')
      } else if (/\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf)$/.test(filePath)) {
        // 若包含哈希文件名(rollup/vite 产物)，启用长期缓存
        const hasHash = /\.[a-f0-9]{8,}\./i.test(path.basename(filePath))
        if (hasHash) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600')
        }
      }
    }
  }))
  // SPA fallback for non-API routes
  app.get(/^(?!\/api).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Start HTTP server ASAP to avoid platform 502 waiting
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

// 版本信息（用于部署校验）：返回 package.json 版本和构建时注入的 GIT_SHA（可选）
app.get('/api/version', (req, res) => {
  try {
    const distVer = path.join(__dirname, 'dist', 'version.txt')
    if (fs.existsSync(distVer)) {
      const txt = fs.readFileSync(distVer, 'utf-8')
      const map = Object.fromEntries(txt.split(/\r?\n/).filter(Boolean).map(l => l.split('=')))
      return res.json({ version: map.version || '0.0.0', git: map.sha || 'unknown', time: map.time })
    }
  } catch {}
  try {
    const pkgPath = path.join(__dirname, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const gitSha = process.env.GIT_SHA || 'unknown'
    res.json({ version: pkg.version || '0.0.0', git: gitSha })
  } catch (e) {
    res.json({ version: 'unknown', git: process.env.GIT_SHA || 'unknown' })
  }
})

// 添加特定的路由来检查数据库状态
app.get('/api/system/db-status', (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({
      status: 'unconfigured',
      message: 'DATABASE_URL not set. Configure it to enable database features.'
    });
  }
  
  res.json({
    status: 'configured',
    message: 'Database connection is configured.'
  });
});

// Init DB in background
;(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set. API requiring DB will fail until configured.')
      console.log('开发环境提示: 请设置 DATABASE_URL 环境变量或配置本地 PostgreSQL 数据库')
      return
    }
    await ensureSchema()
    await seedInitialAdmin()
    console.log('Database schema ensured and admin seeded')
  } catch (e) {
    console.error('Background DB initialization failed', e)
    if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
      console.error('数据库连接失败。请检查连接字符串和数据库服务是否正常运行。')
    }
  }
})()

// Global error handler to prevent hanging requests
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  
  // 特殊处理数据库相关错误
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Database Connection Failed',
      detail: '数据库连接失败，请检查配置',
      code: err.code
    })
  }
  
  // 处理其他数据库错误
  if (err.message && err.message.includes('database')) {
    return res.status(503).json({
      error: 'Database Error',
      detail: err?.message,
      suggestion: '请检查数据库配置并确保服务正常运行'
    })
  }
  
  // 默认错误处理
  res.status(500).json({ error: 'Internal Server Error', detail: err?.message })
})

export default app