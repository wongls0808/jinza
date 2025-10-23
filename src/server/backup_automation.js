import fs from 'fs'
import path from 'path'
import os from 'os'
import archiver from 'archiver'
import { fileURLToPath } from 'url'
import { query } from './db.js'
import * as auth from './auth.js'

// Optional deps (loaded only when configured)
let S3Client, PutObjectCommand
let SESClient, SendEmailCommand, SendRawEmailCommand
let nodemailer
try {
  const s3mod = await import('@aws-sdk/client-s3')
  S3Client = s3mod.S3Client
  PutObjectCommand = s3mod.PutObjectCommand
} catch {}
try {
  const sesmod = await import('@aws-sdk/client-ses')
  SESClient = sesmod.SESClient
  SendEmailCommand = sesmod.SendEmailCommand
  SendRawEmailCommand = sesmod.SendRawEmailCommand
} catch {}
try { nodemailer = (await import('nodemailer')).default } catch {}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true })
  }
}

export function resolveBackupDir() {
  const dataDir = process.env.DATA_DIR || __dirname
  // 使用 dataDir/backups，避免暴露在 /uploads 静态目录下
  const dir = path.join(dataDir, 'backups')
  ensureDir(dir)
  return dir
}

async function listAllTables() {
  const rs = await query(`
    select c.relname as name
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relkind='r'
     order by c.relname
  `)
  return rs.rows.map(r => r.name)
}

function buildBackupFilename(prefix = 'DataBackup') {
  const ts = new Date().toISOString().replaceAll(':','').replaceAll('-','').replace('.', '')
  return `${prefix}-${ts}.zip`
}

async function dumpTablesToZipFile({ tables, outputPath, meta = {} }) {
  return new Promise(async (resolve, reject) => {
    try {
      const out = fs.createWriteStream(outputPath)
      const archive = archiver('zip', { zlib: { level: 9 } })
      archive.on('error', reject)
      out.on('close', () => resolve({ bytes: archive.pointer() }))
      archive.pipe(out)

      const fullMeta = {
        time: new Date().toISOString(),
        host: os.hostname(),
        pid: process.pid,
        user: meta.user || null,
        tables: tables,
      }
      archive.append(JSON.stringify(fullMeta, null, 2), { name: 'meta.json' })

      for (const t of tables) {
        try {
          const rs = await query(`select * from ${t}`)
          const text = JSON.stringify({ name: t, count: rs.rowCount, rows: rs.rows })
          archive.append(text, { name: `tables/${t}.json` })
        } catch (e) {
          archive.append(JSON.stringify({ error: e?.message || String(e) }), { name: `tables/${t}.error.txt` })
        }
      }

      archive.finalize()
    } catch (e) {
      reject(e)
    }
  })
}

async function uploadS3IfConfigured(filePath, key) {
  const bucket = process.env.BACKUP_S3_BUCKET
  const region = process.env.BACKUP_S3_REGION || process.env.AWS_REGION || 'ap-southeast-1'
  const prefix = process.env.BACKUP_S3_PREFIX || ''
  if (!bucket || !S3Client || !PutObjectCommand) return { uploaded: false }
  const client = new S3Client({ region })
  const Key = prefix ? `${prefix.replace(/\/$/, '')}/${key}` : key
  const Body = fs.createReadStream(filePath)
  await client.send(new PutObjectCommand({ Bucket: bucket, Key, Body, ContentType: 'application/zip' }))
  return { uploaded: true, bucket, key: Key }
}

async function sendEmailIfConfigured({ ok, filePath, fileName, s3 }) {
  const to = (process.env.BACKUP_NOTIFY_EMAILS || '').split(',').map(s=>s.trim()).filter(Boolean)
  if (!to.length) return { sent: false }
  // 先尝试 SMTP（如果 nodemailer 可用且已配置）→ 失败则考虑 SES 回退（HTTPS，不附带附件）
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = process.env.SMTP_SECURE === '1' || port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user
  const timeout = Math.max(3000, Number(process.env.SMTP_TIMEOUT_MS || 10000))
  const enableDebug = process.env.SMTP_DEBUG === '1'
  const mkTransport = (p, s) => nodemailer.createTransport({
    host,
    port: p,
    secure: s,
    auth: { user, pass },
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout,
    logger: enableDebug,
    debug: enableDebug,
  })
  const subject = ok ? `数据备份成功: ${fileName}` : `数据备份失败: ${fileName}`
  const lines = []
  lines.push(`时间: ${new Date().toISOString()}`)
  lines.push(`结果: ${ok ? '成功' : '失败'}`)
  if (s3?.uploaded) {
    lines.push(`S3: s3://${s3.bucket}/${s3.key}`)
  } else {
    lines.push(`本地文件: ${filePath}`)
  }
  const attach = process.env.BACKUP_EMAIL_ATTACH === '1'
  const mailOptions = {
    from,
    to,
    subject,
    text: lines.join('\n'),
    attachments: attach ? [{ filename: fileName, path: filePath, contentType: 'application/zip' }] : []
  }
  const trySend = async (p, s) => {
    const transport = mkTransport(p, s)
    const withTimeout = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('SMTP timeout')), timeout + 1000)
      transport.sendMail(mailOptions).then(r => { clearTimeout(t); resolve(r) }).catch(err => { clearTimeout(t); reject(err) })
    })
    try {
      await withTimeout
      return true
    } finally {
      try { transport.close() } catch {}
    }
  }
  // 若提供了完整 SMTP 配置且 nodemailer 可用，则先走 SMTP
  if (nodemailer && host && user && pass) {
    try {
      await trySend(port, secure)
      return { sent: true, via: 'smtp' }
    } catch (e) {
      // 超时或网络错误时回退到 587/STARTTLS
      const msg = String(e?.message||'')
      const code = String(e?.code||'')
      const isNetErr = /timeout|ETIMEDOUT|ECONNREFUSED|EAI_AGAIN|ESOCKET/i.test(msg+code)
      if (isNetErr && !(port===587 && secure===false)) {
        try {
          await trySend(587, false)
          return { sent: true, via: 'smtp-fallback-587' }
        } catch (e2) {
          console.warn('[backup][smtp] fallback 587 failed:', e2?.message||e2)
        }
      }
      // SMTP 明确失败则继续尝试 SES（若可用）
    }
  }

  // 尝试使用 AWS SES（HTTPS 通道）；支持纯文本与附件（RawEmail）
  const sesRegion = process.env.SES_REGION || process.env.AWS_REGION || process.env.BACKUP_S3_REGION
  const sesFrom = process.env.SES_FROM || from || process.env.SMTP_FROM || user
  if (SESClient && (SendEmailCommand || SendRawEmailCommand) && sesRegion && sesFrom) {
    try {
      const client = new SESClient({ region: sesRegion })
      if (attach && SendRawEmailCommand && filePath && fileName) {
        // 通过 RawEmail 发送带附件的 MIME 邮件
        const boundary = '----=_Part_' + Date.now()
        const bodyText = lines.join('\n')
        const fileBuf = fs.readFileSync(filePath)
        const fileB64 = fileBuf.toString('base64')
        const mime = [
          `From: ${sesFrom}`,
          `To: ${to.join(', ')}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          'Content-Type: text/plain; charset="utf-8"',
          'Content-Transfer-Encoding: 7bit',
          '',
          bodyText,
          '',
          `--${boundary}`,
          'Content-Type: application/zip; name="' + fileName + '"',
          'Content-Transfer-Encoding: base64',
          'Content-Disposition: attachment; filename="' + fileName + '"',
          '',
          fileB64,
          '',
          `--${boundary}--`,
          ''
        ].join('\r\n')
        await client.send(new SendRawEmailCommand({ RawMessage: { Data: Buffer.from(mime) } }))
        return { sent: true, via: 'ses-raw' }
      } else {
        // 纯文本（无附件）
        const text = lines.join('\n')
        await client.send(new SendEmailCommand({
          Source: sesFrom,
          Destination: { ToAddresses: to },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Text: { Data: text, Charset: 'UTF-8' } }
          }
        }))
        return { sent: true, via: 'ses' }
      }
    } catch (e) {
      console.warn('[backup][ses] send failed:', e?.message || e)
      throw e
    }
  }

  return { sent: false }
}

function cleanupRetention(dir) {
  const days = Math.max(0, Number(process.env.BACKUP_RETENTION_DAYS || 7))
  if (!days) return { deleted: 0 }
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  let deleted = 0
  for (const f of fs.readdirSync(dir)) {
    if (!/\.zip$/i.test(f)) continue
    const p = path.join(dir, f)
    try {
      const st = fs.statSync(p)
      if (st.mtimeMs < cutoff) { fs.unlinkSync(p); deleted++ }
    } catch {}
  }
  return { deleted }
}

export async function runBackupOnce({ tables, backupDir } = {}) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL 未配置，无法执行备份')
  const dir = backupDir || resolveBackupDir()
  ensureDir(dir)
  const allTables = await listAllTables()
  // 期望：未指定表或指定结果为空时，默认回退为“全部 public 表”
  const envTables = (process.env.BACKUP_TABLES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const requested = Array.isArray(tables) && tables.length ? tables : envTables
  let pick = requested.length ? requested.filter(t => allTables.includes(t)) : allTables
  if (!pick.length) pick = allTables
  const fileName = buildBackupFilename('DataBackup')
  const filePath = path.join(dir, fileName)
  await dumpTablesToZipFile({ tables: pick, outputPath: filePath })
  let s3 = { uploaded: false }
  try { s3 = await uploadS3IfConfigured(filePath, fileName) } catch (e) {
    console.error('[backup] S3 上传失败', e?.message || e)
  }
  try { await auth.logActivity(null, 'system.backup.auto', { tables: pick.length, fileName, s3: s3.uploaded }, null) } catch {}
  const retention = cleanupRetention(dir)
  // 邮件
  try { await sendEmailIfConfigured({ ok: true, filePath, fileName, s3 }) } catch (e) {
    console.error('[backup] 邮件通知失败', e?.message || e)
  }
  return { ok: true, filePath, fileName, dir, s3, retention }
}

function parseDailyTime(s) {
  // Accept HH:mm (24h)
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(String(s || ''))
  if (!m) return { h: 2, m: 30 }
  const h = Math.min(23, Math.max(0, Number(m[1] || 0)))
  const mi = Math.min(59, Math.max(0, Number(m[2] || 0)))
  return { h, m: mi }
}

function msUntilNextDaily({ h, m }) {
  const now = new Date()
  const next = new Date(now)
  next.setHours(h, m, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next - now
}

export function scheduleBackups() {
  if (process.env.BACKUP_ENABLED !== '1') {
    console.log('[backup] 自动备份未启用，设置 BACKUP_ENABLED=1 以开启')
    return { enabled: false }
  }
  if (!process.env.DATABASE_URL) {
    console.warn('[backup] DATABASE_URL 未配置，自动备份将不会执行')
    return { enabled: false }
  }
  const { h, m } = parseDailyTime(process.env.BACKUP_SCHEDULE || '02:30')
  const backupDir = resolveBackupDir()
  ensureDir(backupDir)

  console.log(`[backup] 已启用。每日 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} 触发。目录=${backupDir}`)
  let timer = null
  const scheduleNext = () => {
    const wait = msUntilNextDaily({ h, m })
    timer = setTimeout(async () => {
      try {
        console.log('[backup] 开始执行定时备份...')
        await runBackupOnce({ backupDir })
        console.log('[backup] 定时备份完成')
      } catch (e) {
        console.error('[backup] 定时备份失败', e?.message || e)
        try { await sendEmailIfConfigured({ ok: false, filePath: '', fileName: 'auto', s3: null }) } catch {}
      } finally {
        scheduleNext()
      }
    }, wait)
  }
  scheduleNext()
  return { enabled: true }
}

export default { scheduleBackups, runBackupOnce }
