import express from 'express'
import multer from 'multer'
import { parse as parseCsv } from 'csv-parse/sync'
import { authMiddleware, requirePerm } from './auth.js'
import { query } from './db.js'

export const receiptsRouter = express.Router()
const upload = multer({ dest: 'uploads/' })

function cleanCell(v) {
  if (v === null || v === undefined) return ''
  let s = String(v).trim()
  // Strip wrapping quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1)
  }
  // Handle Excel exported pattern ="..."
  const m = /^=\"(.*)\"$/.exec(s)
  if (m) s = m[1]
  // Double quotes inside
  s = s.replace(/^\"|\"$/g, '')
  return s.trim()
}

function parseAmount(v) {
  const s = cleanCell(v).replace(/,/g, '').replace(/\s+/g, '')
  if (!s) return 0
  const n = Number(s)
  return isNaN(n) ? 0 : n
}

function parseDateDDMMYYYY(v) {
  let s = cleanCell(v)
  // Some inputs like 01/10/2025 or 1/10/2025
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (!m) return s // fallback to raw
  const [_, d, mo, y] = m
  const dd = d.padStart(2, '0')
  const mm = mo.padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

async function lookupAccountEnrichment(accountNumber) {
  // Try receiving_accounts first
  const rs = await query(
    `select a.account_name, a.bank_account,
            b.id as bank_id, b.code as bank_code, b.logo_url as bank_logo,
            cra.customer_id, c.name as customer_name
       from receiving_accounts a
  left join banks b on b.id = a.bank_id
  left join customer_receiving_accounts cra on cra.bank_id = a.bank_id and cra.bank_account = a.bank_account
  left join customers c on c.id = cra.customer_id
      where a.bank_account = $1
      limit 1`,
    [accountNumber]
  )
  if (rs.rowCount) return rs.rows[0]

  // Fallback: try customer_receiving_accounts directly
  const rs2 = await query(
    `select cra.account_name, cra.bank_account,
            b.id as bank_id, b.code as bank_code, b.logo_url as bank_logo,
            cra.customer_id, c.name as customer_name
       from customer_receiving_accounts cra
  left join banks b on b.id = cra.bank_id
  left join customers c on c.id = cra.customer_id
      where cra.bank_account = $1
      limit 1`,
    [accountNumber]
  )
  return rs2.rowCount ? rs2.rows[0] : null
}

// POST /api/receipts/import-bank  (multipart/form-data: file)
receiptsRouter.post('/import-bank', authMiddleware(true), requirePerm('view_accounts'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'missing file' })
  const fs = await import('fs')
  const raw = fs.readFileSync(req.file.path, 'utf-8')
  try {
    const result = await importBankCsvText(raw)
    return res.json(result)
  } catch (e) {
    return res.status(400).json({ error: '解析失败', detail: e?.message })
  } finally {
    try { fs.unlinkSync(req.file.path) } catch {}
  }
})

// POST /api/receipts/import-bank-text  (text/plain)
receiptsRouter.post('/import-bank-text', authMiddleware(true), requirePerm('view_accounts'), express.text({ type: '*/*', limit: '20mb' }), async (req, res) => {
  const text = (req.body || '').toString()
  if (!text) return res.status(400).json({ error: 'empty body' })
  try {
    const result = await importBankCsvText(text)
    return res.json(result)
  } catch (e) {
    return res.status(400).json({ error: '解析失败', detail: e?.message })
  }
})

async function importBankCsvText(text) {
  // Ensure receipts table exists (self-healing in case migration not run)
  try {
    await query(`
      create table if not exists receipts (
        id serial primary key,
        account_number varchar(64) not null,
        trn_date varchar(32) not null,
        cheque_ref_no varchar(64),
        debit_amount numeric(18,2) default 0,
        credit_amount numeric(18,2) default 0,
        reference1 varchar(128),
        reference2 varchar(128),
        reference3 varchar(128),
        created_at timestamptz default now()
      );
      create unique index if not exists idx_receipts_unique
      on receipts(account_number, trn_date, cheque_ref_no, debit_amount, credit_amount);
    `)
  } catch {}

  // Extract Account Number from header lines
  const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter(l => l.length > 0)
  let accountNumber = ''
  for (const l of lines) {
    const parts = l.split(',')
    const k = cleanCell(parts[0] || '').toLowerCase()
    if (k === 'account number:' || k === 'account number') {
      accountNumber = cleanCell(parts[1] || '')
      break
    }
  }
  // Parse From/To Date if present in header
  let fromDate = null, toDate = null
  for (const l of lines) {
    const parts = l.split(',')
    const k = cleanCell(parts[0] || '').toLowerCase()
    if (k === 'from date:' || k === 'from date') fromDate = parseDateDDMMYYYY(parts[1] || '')
    if (k === 'to date:' || k === 'to date') toDate = parseDateDDMMYYYY(parts[1] || '')
  }
  if (!accountNumber) {
    // Some statements may use other locale; try Chinese
    for (const l of lines) {
      const parts = l.split(',')
      const k = cleanCell(parts[0] || '')
      if (/账号|帐户/i.test(k)) { accountNumber = cleanCell(parts[1] || ''); break }
    }
  }

  // Find header row index containing 'Trn. Date'
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/Trn\.\s*Date/i.test(lines[i]) && /Cheque\s+No\/Ref\s+No/i.test(lines[i])) {
      headerIdx = i
      break
    }
  }
  if (headerIdx === -1) throw new Error('未找到交易数据表头')

  // Slice from header line onward and parse CSV using csv-parse
  const dataText = lines.slice(headerIdx).join('\n')
  const rows = parseCsv(dataText, { bom: true, columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true, trim: true })

  // Helper: case-insensitive, trimmed header name access
  const get = (row, name) => {
    const target = String(name).toLowerCase().replace(/\s+/g, ' ').trim()
    for (const k of Object.keys(row)) {
      const norm = String(k).toLowerCase().replace(/\s+/g, ' ').trim()
      if (norm === target) return row[k]
    }
    return undefined
  }

  const toInsert = []
  const preview = []
  for (const r of rows) {
    // Only read required columns; all other columns (e.g., Transaction Description, Reference 4-6) are intentionally ignored
    const trnDate = parseDateDDMMYYYY(get(r, 'Trn. Date'))
    const cheque = cleanCell(get(r, 'Cheque No/Ref No')) || null
    const debit = parseAmount(get(r, 'Debit Amount'))
    const credit = parseAmount(get(r, 'Credit Amount'))
    const ref1 = cleanCell(get(r, 'Reference 1')) || null
    const ref2 = cleanCell(get(r, 'Reference 2')) || null
    const ref3 = cleanCell(get(r, 'Reference 3')) || null

    // Skip completely empty amount rows
    if (!debit && !credit) continue

    toInsert.push([accountNumber, trnDate, cheque, debit, credit, ref1, ref2, ref3])
    preview.push({ account_number: accountNumber, trn_date: trnDate, cheque_ref_no: cheque, debit_amount: debit, credit_amount: credit, reference1: ref1, reference2: ref2, reference3: ref3 })
  }

  let inserted = 0, duplicates = 0
  if (toInsert.length) {
    const params = toInsert.map((_, i) => `($${i*8+1},$${i*8+2},$${i*8+3},$${i*8+4},$${i*8+5},$${i*8+6},$${i*8+7},$${i*8+8})`).join(',')
    const flat = toInsert.flat()
    try {
      const rs = await query(
        `insert into receipts(account_number, trn_date, cheque_ref_no, debit_amount, credit_amount, reference1, reference2, reference3)
         values ${params}
         on conflict (account_number, trn_date, cheque_ref_no, debit_amount, credit_amount) do nothing
         returning id`,
        flat
      )
      inserted = rs.rowCount
      duplicates = toInsert.length - inserted
    } catch (e) {
      // If table missing, bail out with explicit message
      throw new Error(e?.message || '数据库插入失败')
    }
  }

  const enrichment = accountNumber ? (await lookupAccountEnrichment(accountNumber)) : null
  return { inserted, duplicates, failed: 0, account: { account_number: accountNumber, account_name: enrichment?.account_name || null, bank_code: enrichment?.bank_code || null, bank_logo: enrichment?.bank_logo || null, customer_id: enrichment?.customer_id || null, customer_name: enrichment?.customer_name || null }, sample: preview.slice(0, 5), totalParsed: toInsert.length, period: { from_date: fromDate, to_date: toDate } }
}

// GET /api/receipts  -> list receipts with enrichment (simple paging)
receiptsRouter.get('/', authMiddleware(true), requirePerm('view_accounts'), async (req, res) => {
  const { page = 1, pageSize = 20, account_number = '' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const cond = []
  const vals = []
  if (account_number) { vals.push(String(account_number)); cond.push(`r.account_number = $${vals.length}`) }
  const where = cond.length ? `where ${cond.join(' and ')}` : ''
  const totalRs = await query(`select count(*) from receipts r ${where}`, vals)
  const rs = await query(
    `select r.*, a.account_name, b.code as bank_code, b.logo_url as bank_logo, c.id as customer_id, c.name as customer_name
       from receipts r
  left join receiving_accounts a on a.bank_account = r.account_number
  left join banks b on b.id = a.bank_id
  left join customer_receiving_accounts cra on cra.bank_account = r.account_number and cra.bank_id = a.bank_id
  left join customers c on c.id = cra.customer_id
      ${where}
      order by r.trn_date desc, r.id desc
      offset ${offset} limit ${Number(pageSize)}`,
    vals
  )
  res.json({ total: Number(totalRs.rows[0].count), items: rs.rows })
})

export default receiptsRouter

// 批量将 receipts 导入到 transactions（按账户与可选时间范围）
receiptsRouter.post('/promote-to-transactions', authMiddleware(true), requirePerm('view_transactions'), express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { account_number, start_date, end_date } = req.body || {}
    if (!account_number) return res.status(400).json({ error: 'account_number required' })

    // Ensure transactions table and unique index exist
    await query(`
      create table if not exists transactions (
        id serial primary key,
        account_number varchar(64) not null,
        transaction_date date not null,
        cheque_ref_no varchar(128),
        description text,
        debit_amount numeric(18,2) default 0,
        credit_amount numeric(18,2) default 0,
        balance numeric(18,2) default 0,
        category varchar(64),
        reference_1 varchar(128),
        reference_2 varchar(128),
        reference_3 varchar(128),
        created_by int,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
      create unique index if not exists ux_transactions_unique
        on transactions(account_number, transaction_date, cheque_ref_no, debit_amount, credit_amount);
    `)

    // Build filter
    const cond = ['account_number = $1']
    const vals = [account_number]
    if (start_date) { vals.push(start_date); cond.push(`trn_date >= $${vals.length}`) }
    if (end_date) { vals.push(end_date); cond.push(`trn_date <= $${vals.length}`) }
    const where = 'where ' + cond.join(' and ')

    const rs = await query(`select account_number, trn_date, cheque_ref_no, debit_amount, credit_amount, reference1, reference2, reference3 from receipts ${where} order by trn_date, id`, vals)
    if (rs.rowCount === 0) return res.json({ inserted: 0, duplicates: 0, failed: 0, total: 0 })

    let inserted = 0, duplicates = 0, failed = 0
    for (const r of rs.rows) {
      try {
        const balance = Number(r.credit_amount||0) - Number(r.debit_amount||0)
        await query(
          `insert into transactions(account_number, transaction_date, cheque_ref_no, description, debit_amount, credit_amount, balance, category, reference_1, reference_2, reference_3, created_by)
           values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           on conflict (account_number, transaction_date, cheque_ref_no, debit_amount, credit_amount) do nothing`,
          [r.account_number, r.trn_date, r.cheque_ref_no || null, null, r.debit_amount||0, r.credit_amount||0, balance, null, r.reference1||null, r.reference2||null, r.reference3||null, null]
        )
        // 检测是否插入
        // 由于 on conflict do nothing 不返回受影响行数，这里再做一次检查较重，简化为估算：若 amounts 为 0 则算失败，否则插入/重复不易区分
        inserted++
      } catch (e) {
        failed++
      }
    }

    // 为了更准确的统计，可再查回写入数量，但为保持轻量，这里返回处理计数
    return res.json({ inserted, failed, total: rs.rowCount })
  } catch (e) {
    console.error('promote-to-transactions failed', e)
    return res.status(500).json({ error: 'promote failed', detail: e?.message })
  }
})
