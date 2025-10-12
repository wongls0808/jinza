import express from 'express'
import multer from 'multer'
import { parse as parseCsv } from 'csv-parse/sync'
import { authMiddleware, requirePerm } from './auth.js'
import { query } from './db.js'

// 全量重写：收据导入与列表
export const receiptsRouter = express.Router()
const upload = multer({ dest: 'uploads/' })

// ---------- Utils ----------
function cleanCell(v) {
  if (v === null || v === undefined) return ''
  let s = String(v).trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1)
  const m = /^=\"(.*)\"$/.exec(s)
  if (m) s = m[1]
  return s.replace(/^\"|\"$/g, '').trim()
}
function parseAmount(v) {
  const s = cleanCell(v).replace(/,/g, '').replace(/\s+/g, '')
  if (!s) return 0
  const n = Number(s)
  return isNaN(n) ? 0 : n
}
function parseDateDDMMYYYY(v) {
  const s = cleanCell(v)
  // 允许 dd/mm/yyyy 或 d/m/yyyy 或 dd-mm-yyyy
  let m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(s)
  if (!m) return s // fallback
  let [_, d, mo, y] = m
  if (y.length === 2) y = (y >= '70' ? '19' : '20') + y // 70-99 => 19xx, 00-69 => 20xx
  const dd = d.padStart(2, '0')
  const mm = mo.padStart(2, '0')
  return `${y}-${mm}-${dd}`
}
function normKey(k){ return String(k||'').toLowerCase().replace(/\s+/g,' ').trim() }

async function ensureReceiptsDDL(){
  await query(`
    create table if not exists receipts (
      id serial primary key,
      account_number varchar(64) not null,
      trn_date varchar(32) not null,
      cheque_ref_no varchar(128),
      debit_amount numeric(18,2) default 0,
      credit_amount numeric(18,2) default 0,
      reference1 varchar(256),
      reference2 varchar(256),
      reference3 varchar(256),
      created_at timestamptz default now()
    );
    create unique index if not exists ux_receipts_unique
      on receipts(account_number, trn_date, cheque_ref_no, debit_amount, credit_amount);
  `)
}

async function lookupAccountEnrichment(accountNumber) {
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

// ---------- Core Parser ----------
function extractHeaderInfo(lines){
  let accountNumber = ''
  let fromDate = null, toDate = null
  for (const l of lines) {
    const parts = l.split(',')
    const k = normKey(cleanCell(parts[0] || ''))
    const v = parts[1]
    if (k === 'account number:' || k === 'account number' || /账号|帐户/.test(parts[0]||'')) {
      accountNumber = cleanCell(v)
    }
    if (k === 'from date:' || k === 'from date') fromDate = parseDateDDMMYYYY(v)
    if (k === 'to date:' || k === 'to date') toDate = parseDateDDMMYYYY(v)
  }
  return { accountNumber, fromDate, toDate }
}

function findDataHeaderIndex(lines){
  for (let i=0;i<lines.length;i++){
    const line = lines[i]
    if (/Trn\.\s*Date/i.test(line) && /Cheque\s+No\/?Ref\s+No/i.test(line)) return i
  }
  return -1
}

function mapAndFilterRows(parsedRows){
  const get = (row, name) => {
    const target = normKey(name)
    for (const k of Object.keys(row)) if (normKey(k) === target) return row[k]
    return undefined
  }
  const out = []
  for (const r of parsedRows){
    const trnDate = parseDateDDMMYYYY(get(r, 'Trn. Date'))
    const cheque = cleanCell(get(r, 'Cheque No/Ref No')) || null
    const debit = parseAmount(get(r, 'Debit Amount'))
    const credit = parseAmount(get(r, 'Credit Amount'))
    const ref1 = cleanCell(get(r, 'Reference 1')) || null
    const ref2 = cleanCell(get(r, 'Reference 2')) || null
    const ref3 = cleanCell(get(r, 'Reference 3')) || null
    // 跳过无金额与无日期的行（小计/空行）
    if ((!debit && !credit) || !/^\d{4}-\d{2}-\d{2}$/.test(trnDate)) continue
    out.push({ trnDate, cheque, debit, credit, ref1, ref2, ref3 })
  }
  return out
}

async function importBankCsvText(text){
  await ensureReceiptsDDL()
  const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter(l => l && l.trim().length)
  const header = extractHeaderInfo(lines)
  const headerIdx = findDataHeaderIndex(lines)
  if (headerIdx === -1) throw new Error('未找到交易表头（Trn. Date/ Cheque No/Ref No）')
  const dataText = lines.slice(headerIdx).join('\n')
  const parsed = parseCsv(dataText, { bom:true, columns:true, skip_empty_lines:true, relax_quotes:true, relax_column_count:true, trim:true })
  const rows = mapAndFilterRows(parsed)

  if (!rows.length) return { inserted: 0, duplicates: 0, failed: 0, account: { account_number: header.accountNumber || null }, sample: [], totalParsed: 0, period: { from_date: header.fromDate, to_date: header.toDate } }

  // 批量插入
  const values = rows.map(r => [header.accountNumber, r.trnDate, r.cheque, r.debit, r.credit, r.ref1, r.ref2, r.ref3])
  const params = values.map((_,i)=>`($${i*8+1},$${i*8+2},$${i*8+3},$${i*8+4},$${i*8+5},$${i*8+6},$${i*8+7},$${i*8+8})`).join(',')
  const flat = values.flat()
  let inserted = 0
  try{
    const rs = await query(`
      insert into receipts(account_number, trn_date, cheque_ref_no, debit_amount, credit_amount, reference1, reference2, reference3)
      values ${params}
      on conflict (account_number, trn_date, cheque_ref_no, debit_amount, credit_amount) do nothing
      returning id
    `, flat)
    inserted = rs.rowCount
  }catch(e){
    throw new Error(e?.message || '数据库插入失败')
  }
  const duplicates = values.length - inserted
  const enrichment = header.accountNumber ? (await lookupAccountEnrichment(header.accountNumber)) : null
  return {
    inserted,
    duplicates,
    failed: 0,
    account: {
      account_number: header.accountNumber || null,
      account_name: enrichment?.account_name || null,
      bank_code: enrichment?.bank_code || null,
      bank_logo: enrichment?.bank_logo || null,
      customer_id: enrichment?.customer_id || null,
      customer_name: enrichment?.customer_name || null
    },
    sample: values.slice(0,5).map(v => ({ account_number: v[0], trn_date: v[1], cheque_ref_no: v[2], debit_amount: v[3], credit_amount: v[4], reference1: v[5], reference2: v[6], reference3: v[7] })),
    totalParsed: values.length,
    period: { from_date: header.fromDate, to_date: header.toDate }
  }
}

// ---------- Routes (new) ----------
// 新导入（multipart 文件）
receiptsRouter.post('/import', authMiddleware(true), requirePerm('view_accounts'), upload.single('file'), async (req, res) => {
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

// 新导入（纯文本）
receiptsRouter.post('/import-text', authMiddleware(true), requirePerm('view_accounts'), express.text({ type: '*/*', limit: '20mb' }), async (req, res) => {
  const text = (req.body || '').toString()
  if (!text) return res.status(400).json({ error: 'empty body' })
  try {
    const result = await importBankCsvText(text)
    return res.json(result)
  } catch (e) {
    return res.status(400).json({ error: '解析失败', detail: e?.message })
  }
})

// 列表（仅返回规范字段 + 富化）
receiptsRouter.get('/', authMiddleware(true), requirePerm('view_accounts'), async (req, res) => {
  const { page = 1, pageSize = 20, account_number = '' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const cond = []
  const vals = []
  if (account_number) { vals.push(String(account_number)); cond.push(`r.account_number = $${vals.length}`) }
  const where = cond.length ? `where ${cond.join(' and ')}` : ''
  const totalRs = await query(`select count(*) from receipts r ${where}`, vals)
  const rs = await query(
    `select 
      r.account_number, r.trn_date, r.cheque_ref_no, r.debit_amount, r.credit_amount, r.reference1, r.reference2, r.reference3,
      a.account_name, b.code as bank_code, b.logo_url as bank_logo, c.id as customer_id, c.name as customer_name
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

// 批量转入交易
receiptsRouter.post('/promote-to-transactions', authMiddleware(true), requirePerm('view_transactions'), express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { account_number, start_date, end_date } = req.body || {}
    if (!account_number) return res.status(400).json({ error: 'account_number required' })
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
      create unique index if not exists ux_transactions_unique on transactions(account_number, transaction_date, cheque_ref_no, debit_amount, credit_amount);
    `)
    const cond = ['account_number = $1']
    const vals = [account_number]
    if (start_date) { vals.push(start_date); cond.push(`trn_date >= $${vals.length}`) }
    if (end_date) { vals.push(end_date); cond.push(`trn_date <= $${vals.length}`) }
    const rs = await query(`select account_number, trn_date, cheque_ref_no, debit_amount, credit_amount, reference1, reference2, reference3 from receipts where ${cond.join(' and ')} order by trn_date, id`, vals)
    if (rs.rowCount === 0) return res.json({ inserted: 0, failed: 0, total: 0 })
    let inserted = 0, failed = 0
    for (const r of rs.rows) {
      try {
        const balance = Number(r.credit_amount||0) - Number(r.debit_amount||0)
        await query(
          `insert into transactions(account_number, transaction_date, cheque_ref_no, description, debit_amount, credit_amount, balance, category, reference_1, reference_2, reference_3, created_by)
           values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           on conflict (account_number, transaction_date, cheque_ref_no, debit_amount, credit_amount) do nothing`,
          [r.account_number, r.trn_date, r.cheque_ref_no || null, null, r.debit_amount||0, r.credit_amount||0, balance, null, r.reference1||null, r.reference2||null, r.reference3||null, null]
        )
        inserted++
      } catch { failed++ }
    }
    return res.json({ inserted, failed, total: rs.rowCount })
  } catch (e) {
    console.error('promote-to-transactions failed', e)
    return res.status(500).json({ error: 'promote failed', detail: e?.message })
  }
})

export default receiptsRouter
