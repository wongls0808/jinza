import express from 'express'
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
app.use(express.json())

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

async function start() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set. API requiring DB will fail until configured.')
    } else {
      await ensureSchema()
      await seedInitialAdmin()
      console.log('Database schema ensured and admin seeded')
    }
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`)
    })
  } catch (e) {
    console.error('Failed to start server', e)
    process.exit(1)
  }
}

start()

export default app