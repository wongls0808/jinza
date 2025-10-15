import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.join(__dirname, '..')

function getPkg() {
  try {
    const txt = fs.readFileSync(path.join(root, 'package.json'), 'utf-8')
    return JSON.parse(txt)
  } catch { return { version: '0.0.0' } }
}

function getGitSha() {
  try {
    const out = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
    return String(out).trim()
  } catch { return 'unknown' }
}

function writeVersionFile() {
  const pkg = getPkg()
  const sha = getGitSha()
  const dist = path.join(root, 'dist')
  const content = `version=${pkg.version || '0.0.0'}\nsha=${sha}\ntime=${new Date().toISOString()}\n`
  try {
    if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true })
    fs.writeFileSync(path.join(dist, 'version.txt'), content)
    console.log('[version] Wrote dist/version.txt:', content.replace(/\n/g, ' | '))
  } catch (e) {
    console.warn('[version] Failed to write version file:', e?.message)
  }
}

writeVersionFile()
