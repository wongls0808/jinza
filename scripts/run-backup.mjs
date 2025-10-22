#!/usr/bin/env node
import { runBackupOnce } from '../src/server/backup_automation.js'
import { closePool } from '../src/server/db.js'

async function main() {
  if (!process.env.DATABASE_URL && !process.env.DEV_LOCAL_DB) {
    console.error('请设置 DATABASE_URL 或 DEV_LOCAL_DB 后再运行备份脚本')
    process.exitCode = 1
    return
  }
  const tablesArg = process.argv.find(a => a.startsWith('--tables='))
  const tables = tablesArg ? tablesArg.split('=')[1].split(',').map(s=>s.trim()).filter(Boolean) : undefined
  try {
    const res = await runBackupOnce({ tables })
    console.log('[backup] 完成 =>', { file: res.filePath, s3: res.s3 })
  } catch (e) {
    console.error('[backup] 失败:', e?.message || e)
    process.exitCode = 2
  } finally {
    try { await closePool() } catch {}
  }
}

main()
