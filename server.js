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

// Init DB in background
;(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set. API requiring DB will fail until configured.')
      return
    }
    await ensureSchema()
    await seedInitialAdmin()
    console.log('Database schema ensured and admin seeded')
  } catch (e) {
    console.error('Background DB initialization failed', e)
  }
})()

// Global error handler to prevent hanging requests
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal Server Error' })
})

export default app