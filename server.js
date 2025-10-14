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

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Serve runtime uploads (e.g., bank logos) — use persistent DATA_DIR when available
const dataDir = process.env.DATA_DIR || path.join(__dirname)
const uploadsPath = path.join(dataDir, 'uploads')
if (!fs.existsSync(uploadsPath)) {
  try { fs.mkdirSync(uploadsPath, { recursive: true }) } catch {}
}
console.log('[static] DATA_DIR=', dataDir, 'uploadsPath=', uploadsPath)
app.use('/uploads', express.static(uploadsPath))

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
  app.use(express.static(distPath))
  // SPA fallback for non-API routes
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Start HTTP server ASAP to avoid platform 502 waiting
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
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