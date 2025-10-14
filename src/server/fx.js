import express from 'express'
import PDFDocument from 'pdfkit'
import SVGtoPDF from 'svg-to-pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware, requirePerm } from './auth.js'
import { query } from './db.js'

export const fxRouter = express.Router()

async function ensureDDL() {
  await query(`
    create table if not exists fx_settlements(
      id serial primary key,
      bill_no varchar(40),
      customer_id int not null,
      customer_name varchar(255),
      settle_date date not null,
      rate numeric(18,6) not null,
      customer_tax_rate numeric(6,2) default 0,
      total_base numeric(18,2) default 0,
      total_settled numeric(18,2) default 0,
      created_by int,
      created_at timestamptz default now()
    );
    create table if not exists fx_settlement_items(
      id serial primary key,
      settlement_id int not null references fx_settlements(id) on delete cascade,
      transaction_id int not null,
      account_number varchar(64),
      trn_date date,
      amount_base numeric(18,2) default 0,
      amount_settled numeric(18,2) default 0
    );
    create table if not exists fx_payments(
      id serial primary key,
      bill_no varchar(40),
      customer_id int not null,
      customer_name varchar(255),
      pay_date date not null,
      created_by int,
      created_at timestamptz default now()
    );
    create table if not exists fx_payment_items(
      id serial primary key,
      payment_id int not null references fx_payments(id) on delete cascade,
      account_id int not null,
      account_name varchar(255),
      bank_account varchar(64),
      currency_code varchar(8),
      amount numeric(18,2) not null
    );
  `)
  // 向后兼容：老表补充 bill_no 列
  await query(`alter table fx_settlements add column if not exists bill_no varchar(40)`)
  await query(`alter table fx_payments add column if not exists bill_no varchar(40)`)
}

// 创建结汇单
fxRouter.post('/settlements', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const { customer_id, customer_name, settle_date, rate, customer_tax_rate = 0, items = [] } = req.body || {}
  if (!customer_id || !settle_date || !rate || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'invalid payload' })
  const created_by = req.user?.id || null
  // 生成单号：基于 created_at ISO 字符串去除冒号与连字符，保留 T
  const createdAtIso = new Date().toISOString()
  // 例：2025-10-13T14:27:01.103Z -> 20251013T142701103Z
  const bill_no = createdAtIso.replaceAll('-', '').replaceAll(':', '').replace('.', '')
  // 计算合计：基币金额（按 credit-debit）与结汇金额（基币*汇率）
  const total_base = items.reduce((s, it) => s + Number(it.amount_base||0), 0)
  const total_settled = total_base * Number(rate)
  const ins = await query(
    `insert into fx_settlements(bill_no, customer_id, customer_name, settle_date, rate, customer_tax_rate, total_base, total_settled, created_by)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
    [bill_no, Number(customer_id), customer_name || null, settle_date, Number(rate), Number(customer_tax_rate)||0, total_base, total_settled, created_by]
  )
  const sid = ins.rows[0].id
  // 批量写入明细
  if (items.length) {
    const values = []
    const params = []
    let idx = 1
    for (const it of items) {
      values.push(`($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`)
      params.push(sid, Number(it.transaction_id), it.account_number || null, it.trn_date || null, Number(it.amount_base)||0, Number(it.amount_settled)||0)
    }
    await query(`insert into fx_settlement_items(settlement_id, transaction_id, account_number, trn_date, amount_base, amount_settled) values ${values.join(',')}`, params)
  }
  res.json({ id: sid })
})

fxRouter.get('/settlements', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const { customerId, startDate, endDate, page = 1, pageSize = 20 } = req.query
  const where = []
  const params = []
  let idx = 1
  if (customerId) { where.push(`s.customer_id = $${idx++}`); params.push(Number(customerId)) }
  if (startDate) { where.push(`s.settle_date >= $${idx++}`); params.push(startDate) }
  if (endDate)   { where.push(`s.settle_date <= $${idx++}`); params.push(endDate) }
  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  const total = await query(`select count(*) from fx_settlements s ${whereSql}`, params)
  const offset = (Number(page)-1) * Number(pageSize)
  const rows = await query(
    `with tx_agg as (
       select 
         t.match_target_id as customer_id,
         sum(case when upper(a.currency_code)='MYR' then coalesce(t.credit_amount,0) - coalesce(t.debit_amount,0) else 0 end) as net_myr
       from transactions t
       left join receiving_accounts a on a.bank_account = t.account_number
       where coalesce(t.matched,false) = true and t.match_type = 'customer'
       group by t.match_target_id
     ), b as (
       select 
         s.*, 
         c.abbr as customer_abbr,
         coalesce(c.opening_myr,0) as opening_myr,
         coalesce(tx.net_myr,0) as net_myr,
         sum(s.total_base) over (partition by s.customer_id order by s.settle_date, s.id rows between unbounded preceding and 1 preceding) as prev_settle_base
       from fx_settlements s
       left join customers c on c.id = s.customer_id
       left join tx_agg tx on tx.customer_id = s.customer_id
       ${whereSql}
     )
     select 
       b.*,
       (b.opening_myr + b.net_myr - coalesce(b.prev_settle_base,0)) as pre_balance_myr,
       coalesce(u.display_name, u.username) as created_by_name
     from b
     left join users u on u.id = b.created_by
     order by b.id desc offset $${idx++} limit $${idx++}`,
    [...params, offset, Number(pageSize)]
  )
  res.json({ total: Number(total.rows[0].count || 0), items: rows.rows })
})

// 结汇单：列表导出（按筛选），scope=all|page（默认 all）
fxRouter.get('/settlements/export', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const { customerId, startDate, endDate, page = 1, pageSize = 20, scope = 'all' } = req.query
  const where = []
  const params = []
  let idx = 1
  if (customerId) { where.push(`s.customer_id = $${idx++}`); params.push(Number(customerId)) }
  if (startDate) { where.push(`s.settle_date >= $${idx++}`); params.push(startDate) }
  if (endDate)   { where.push(`s.settle_date <= $${idx++}`); params.push(endDate) }
  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  let limitSql = ''
  if (String(scope) === 'page') {
    const offset = (Number(page)-1) * Number(pageSize)
    limitSql = ` offset ${offset} limit ${Number(pageSize)}`
  }
  const rs = await query(
    `select s.*, coalesce(u.display_name, u.username) as created_by_name
     from fx_settlements s
     left join users u on u.id = s.created_by
     ${whereSql}
     order by s.id desc${limitSql}`,
    params
  )
  const header = ['Bill No','Customer ID','Customer Name','Settle Date','Rate','Total Base','Total Settled','Created By','Created At']
  const rows = rs.rows.map(h => [h.bill_no||'', h.customer_id, h.customer_name||'', h.settle_date, h.rate, h.total_base, h.total_settled, h.created_by_name||'', h.created_at])
  const csvRows = [header, ...rows]
  const csv = csvRows.map(r => r.map(v => {
    const s = v==null? '': String(v)
    return (/[",\n]/.test(s)) ? '"'+s.replace(/"/g,'""')+'"' : s
  }).join(',')).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=Settlements-${Date.now()}.csv`)
  res.send('\uFEFF' + csv)
})

// 结汇单：明细
fxRouter.get('/settlements/:id', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  // 详情头部：补充 customer_abbr 与 pre_balance_myr（同列表口径：期初 + 已匹配MYR净额 - 之前结汇基币合计）
  const head = await query(
    `with tx_agg as (
       select 
         t.match_target_id as customer_id,
         sum(case when upper(a.currency_code)='MYR' then coalesce(t.credit_amount,0) - coalesce(t.debit_amount,0) else 0 end) as net_myr
       from transactions t
       left join receiving_accounts a on a.bank_account = t.account_number
       where coalesce(t.matched,false) = true and t.match_type = 'customer'
       group by t.match_target_id
     )
     select 
       s.*,
       c.abbr as customer_abbr,
       coalesce(c.opening_myr,0) as opening_myr,
       coalesce(tx.net_myr,0) as net_myr,
       (
         select sum(s2.total_base) 
         from fx_settlements s2 
         where s2.customer_id = s.customer_id 
           and (s2.settle_date < s.settle_date or (s2.settle_date = s.settle_date and s2.id < s.id))
       ) as prev_settle_base,
       coalesce(u.display_name, u.username) as created_by_name
     from fx_settlements s
     left join customers c on c.id = s.customer_id
     left join tx_agg tx on tx.customer_id = s.customer_id
     left join users u on u.id = s.created_by
     where s.id = $1`,
    [id]
  )
  if (!head.rows.length) return res.status(404).json({ error: 'not found' })
  const h = head.rows[0]
  const pre_balance_myr = Number(h.opening_myr || 0) + Number(h.net_myr || 0) - Number(h.prev_settle_base || 0)
  // 明细：联表获取原始参考号、银行名称、账户名，并计算每行折算金额（若存量为0则用基币*汇率）
  const items = await query(
    `select 
       i.id,
       i.transaction_id,
       i.account_number,
       i.trn_date,
  i.amount_base,
  case when coalesce(i.amount_settled,0) = 0 then (i.amount_base * s.rate) else i.amount_settled end as amount_settled_calc,
       t.cheque_ref_no as ref_no,
  a.account_name,
  b.zh as bank_name,
  b.en as bank_name_en,
  b.code as bank_code,
       b.logo_url as bank_logo_url
     from fx_settlement_items i
     left join fx_settlements s on s.id = i.settlement_id
     left join transactions t on t.id = i.transaction_id
  left join receiving_accounts a on a.bank_account = i.account_number
  left join banks b on b.id = a.bank_id
     where i.settlement_id = $1
     order by i.trn_date asc nulls last, i.id asc`,
    [id]
  )
  res.json({ ...h, pre_balance_myr, items: items.rows })
})

// 结汇单：导出 CSV
fxRouter.get('/settlements/:id/export', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const head = await query(`select * from fx_settlements where id=$1`, [id])
  if (!head.rows.length) return res.status(404).json({ error: 'not found' })
  const items = await query(`select * from fx_settlement_items where settlement_id=$1 order by id`, [id])
  // 生成 CSV
  const h = head.rows[0]
  const headerLines = [
    ['Bill No', h.bill_no||''],
    ['Customer ID', h.customer_id],
    ['Customer Name', h.customer_name||''],
    ['Settle Date', h.settle_date?.toISOString?.().slice(0,10) || h.settle_date || ''],
    ['Rate', h.rate],
    ['Customer Tax Rate', h.customer_tax_rate],
    ['Total Base', h.total_base],
    ['Total Settled', h.total_settled],
    ['Created By', h.created_by||''],
    ['Created At', h.created_at?.toISOString?.() || h.created_at || ''],
    [],
  ]
  const itemHeader = ['Transaction ID','TRN Date','Account Number','Amount Base','Amount Settled']
  const itemRows = items.rows.map(r => [r.transaction_id, r.trn_date||'', r.account_number||'', r.amount_base, r.amount_settled])
  const csvRows = [...headerLines, itemHeader, ...itemRows]
  const csv = csvRows.map(row => (Array.isArray(row) ? row.map(v => {
    const s = (v==null?'' : String(v))
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return '"'+s.replace(/"/g,'""')+'"'
    return s
  }).join(',') : '').toString()).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=Settlement-${id}.csv`)
  res.send('\uFEFF' + csv)
})

// 结汇单：导出 PDF（账单预览）
fxRouter.get('/settlements/:id/pdf', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  // 语言选择：优先 query.lang，其次 Accept-Language；仅区分 zh / en
  const pickLang = () => {
    const q = String(req.query.lang||'').toLowerCase()
    if (q) {
      if (q.startsWith('zh')) return 'zh'
      if (q.startsWith('en')) return 'en'
    }
    const al = String(req.headers['accept-language']||'').toLowerCase()
    if (al.includes('zh')) return 'zh'
    return 'en'
  }
  const lang = pickLang()
  const I18N = {
    en: {
      title: 'Settlement Bill',
      partners: 'Partners',
      billNo: 'Bill No',
      settleDate: 'Settle Date',
      rate: 'Rate',
      customerAbbr: 'Customer Abbr',
      customerName: 'Customer Name',
  customerTax: 'Customer Tax',
      preSettleBalance: 'Pre-Settle Balance',
      selectedBase: 'Selected Base',
      selectedConverted: 'Selected Converted',
      createdBy: 'Created By',
      createdAt: 'Created At',
      thIndex: '#',
      thRefNo: 'Ref No',
      thDate: 'Date',
  thBankEn: 'Bank',
      thAccountName: 'Account Name',
      thAccountNo: 'Account No',
      thBase: 'Base',
      thConverted: 'Converted'
    },
    zh: {
      title: '结汇单',
      partners: '合作机构',
      billNo: '单号',
      settleDate: '结汇日期',
      rate: '汇率',
      customerAbbr: '客户简称',
      customerName: '客户名称',
  customerTax: '客户税率',
      preSettleBalance: '期初余额',
      selectedBase: '已选基币合计',
      selectedConverted: '已选折算合计',
      createdBy: '创建人',
      createdAt: '创建时间',
      thIndex: '序号',
      thRefNo: '参考号',
      thDate: '日期',
  thBankEn: '银行',
      thAccountName: '账户名',
      thAccountNo: '账号',
      thBase: '基币',
      thConverted: '折算'
    }
  }
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k
  // 复用详情查询逻辑
  const head = await query(
    `with tx_agg as (
       select 
         t.match_target_id as customer_id,
         sum(case when upper(a.currency_code)='MYR' then coalesce(t.credit_amount,0) - coalesce(t.debit_amount,0) else 0 end) as net_myr
       from transactions t
       left join receiving_accounts a on a.bank_account = t.account_number
       where coalesce(t.matched,false) = true and t.match_type = 'customer'
       group by t.match_target_id
     )
     select 
       s.*,
       c.abbr as customer_abbr,
       coalesce(c.opening_myr,0) as opening_myr,
       coalesce(tx.net_myr,0) as net_myr,
       (
         select sum(s2.total_base) 
         from fx_settlements s2 
         where s2.customer_id = s.customer_id 
           and (s2.settle_date < s.settle_date or (s2.settle_date = s.settle_date and s2.id < s.id))
       ) as prev_settle_base,
       coalesce(u.display_name, u.username) as created_by_name
     from fx_settlements s
     left join customers c on c.id = s.customer_id
     left join tx_agg tx on tx.customer_id = s.customer_id
     left join users u on u.id = s.created_by
     where s.id = $1`,
    [id]
  )
  if (!head.rows.length) return res.status(404).json({ error: 'not found' })
  const h = head.rows[0]
  const pre_balance_myr = Number(h.opening_myr || 0) + Number(h.net_myr || 0) - Number(h.prev_settle_base || 0)
  const items = await query(
    `select 
       i.id,
       i.transaction_id,
       i.account_number,
       i.trn_date,
       i.amount_base,
       case when coalesce(i.amount_settled,0) = 0 then (i.amount_base * s.rate) else i.amount_settled end as amount_settled_calc,
       t.cheque_ref_no as ref_no,
  a.account_name,
  b.zh as bank_name,
  b.en as bank_name_en,
  b.code as bank_code,
       b.logo_url as bank_logo_url
     from fx_settlement_items i
     left join fx_settlements s on s.id = i.settlement_id
     left join transactions t on t.id = i.transaction_id
     left join receiving_accounts a on a.bank_account = i.account_number
     left join banks b on b.id = a.bank_id
     where i.settlement_id = $1
     order by i.trn_date asc nulls last, i.id asc`,
    [id]
  )

  // PDF 输出：文件名为单号
  res.setHeader('Content-Type', 'application/pdf')
  const fileBase = (h.bill_no ? String(h.bill_no) : `Settlement-${id}`)
  const asciiName = `${fileBase}.pdf`.replace(/[^\x20-\x7E]/g, '_')
  const utf8Name = encodeURIComponent(`${fileBase}.pdf`)
  // 同时提供 filename 与 filename* 以兼容各类客户端
  res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`)
  // A5 横版，较小页面，减小边距以获得更大内容区
  const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margins: { top: 24, bottom: 24, left: 24, right: 24 } })
  doc.pipe(res)

  // 可选中文字体支持：优先尝试项目内 CJK 字体，统一整份 PDF 使用 CJK 避免中文乱码
  let hasCJK = false
  let hasCJKBold = false
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const candidatesRegular = [
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Regular.ttf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Regular.otf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansCJKsc-Regular.otf')
    ]
    const candidatesBold = [
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Bold.ttf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Bold.otf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansCJKsc-Bold.otf')
    ]
    const foundRegular = candidatesRegular.find(p => fs.existsSync(p))
    const foundBold = candidatesBold.find(p => fs.existsSync(p))
    if (foundRegular) {
      doc.registerFont('CJK', foundRegular)
      hasCJK = true
    }
    if (foundBold) {
      doc.registerFont('CJK-Bold', foundBold)
      hasCJKBold = true
    }
  } catch {/* noop */}
  // 默认字体：若找到 CJK 则用之，否则回退 Helvetica
  doc.font(hasCJK ? 'CJK' : 'Helvetica')

  const title = t('title')
  doc.font(hasCJKBold ? 'CJK-Bold' : hasCJK ? 'CJK' : 'Helvetica-Bold')
    .fontSize(14)
    .text(title, { align: 'center' })
  doc.moveDown(0.5)
  const toStr = (v) => v==null? '' : String(v)
  const toDate = (v) => {
    try { if (typeof v === 'string') return v.slice(0,10); if (v.toISOString) return v.toISOString().slice(0,10); return String(v).slice(0,10) } catch { return String(v).slice(0,10) }
  }
  const money = (n) => Number(n||0).toLocaleString(undefined,{ minimumFractionDigits:2, maximumFractionDigits:2 })
  const money0 = (n) => Math.round(Number(n||0)).toLocaleString()
  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const contentWidth = right - left
  // 自动压缩文字到指定宽度（不换行）
  function textFit(txt, x, y, width, opts={}) {
    const max = opts.maxSize ?? 9
    const min = opts.minSize ?? 7
    const noAdvanceY = opts.noAdvanceY === true
    let size = max
    while (size > min) {
      doc.fontSize(size)
      const w = doc.widthOfString(String(txt||''), { width, ...opts })
      if (w <= width) break
      size -= 0.5
    }
    const prevY = doc.y
    doc.fontSize(size)
    doc.text(String(txt||''), x, y, { width, lineBreak: false, ...opts })
    if (noAdvanceY) doc.y = prevY
  }

  const headerPairs = [
    [t('billNo'), toStr(h.bill_no)],
    [t('settleDate'), toDate(h.settle_date)],
    [t('rate'), Number(h.rate||0).toFixed(4)],
    [t('customerAbbr'), toStr(h.customer_abbr||'')],
    [t('customerName'), toStr(h.customer_name||'')],
    [t('customerTax'), Number(h.customer_tax_rate||0).toFixed(2)+'%'],
    [t('preSettleBalance'), money(pre_balance_myr)],
    [t('selectedBase'), money(h.total_base)],
    [t('selectedConverted'), money0(h.total_settled)],
    [t('createdBy'), toStr(h.created_by_name||'')],
    [t('createdAt'), toDate(h.created_at)]
  ]
  // 统一信息区字号
  doc.font(hasCJK ? 'CJK' : 'Helvetica').fontSize(9)
  const hCol = Math.floor(contentWidth/2) - 8
  for (let i=0;i<headerPairs.length;i+=2) {
    const [k1,v1] = headerPairs[i]
    const y = doc.y
    textFit(`${k1}: ${v1}`, left, y, hCol)
    if (i+1 < headerPairs.length) {
      const [k2,v2] = headerPairs[i+1]
      textFit(`${k2}: ${v2}`, left + hCol + 16, y, hCol)
    }
    doc.moveDown(0.6)
  }
  doc.moveDown(0.3)
  doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke()
  doc.moveDown(0.5)

  // 表头
  const tableX = left
  // 去除序号列，为银行/账户名留出更多空间
  const colDefs = [
    { key: t('thRefNo'), w: 3 },
    { key: t('thDate'), w: 3 },
    { key: t('thBankEn'), w: 4 },
    { key: t('thAccountName'), w: 6 },
    { key: t('thAccountNo'), w: 4 },
    { key: t('thBase'), w: 3, align: 'right' },
    { key: t('thConverted'), w: 3, align: 'right' }
  ]
  const weightSum = colDefs.reduce((s,c)=>s+c.w,0)
  const cols = colDefs.map(c => ({ ...c, w: Math.floor(c.w/weightSum * contentWidth) }))
  // 表头行高与当前 y
  // 增大行高，避免行间过密导致视觉重叠
  let rowH = 16
  let y = doc.y
  let x = tableX
  // 表头统一字号；若有 CJK Bold 则加粗
  doc.font(hasCJKBold ? 'CJK-Bold' : hasCJK ? 'CJK' : 'Helvetica-Bold').fontSize(9)
  cols.forEach(c => { textFit(c.key, x, y, c.w, { align: c.align||'left', noAdvanceY: true }); x += c.w })
  doc.y = y + rowH
  // 行内容统一使用同一字体，避免混合导致测宽不准与字符重叠
  doc.font(hasCJK ? 'CJK' : 'Helvetica')
  doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke()

  // 行
  let sumBase = 0, sumSettle = 0
  items.rows.forEach(r => {
    const row = [
      toStr(r.ref_no||''),
      toDate(r.trn_date),
      toStr(String(r.bank_code||'').toUpperCase()),
      toStr(r.account_name||''),
      toStr(r.account_number||''),
      money(r.amount_base||0),
      money0(r.amount_settled_calc||0)
    ]
    y = doc.y
    x = tableX
    // 行内容字号统一
    doc.fontSize(9)
    cols.forEach((c,i) => {
      const align = c.align||'left'
      textFit(String(row[i]??''), x, y, c.w, { align, noAdvanceY: true })
      x += c.w
    })
    sumBase += Number(r.amount_base||0)
    sumSettle += Number(r.amount_settled_calc||0)
    // 固定行高换行，绘制行分隔
    doc.y = y + rowH
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#cccccc').stroke().strokeColor('black')
  })
  doc.moveDown(0.2)
  // 合计
  let sumY = doc.y
  x = tableX + cols.slice(0, cols.length-2).reduce((s,c)=>s+c.w,0)
  textFit(money(sumBase), x, sumY, cols[cols.length-2].w, { align: 'right', noAdvanceY: true })
  x += cols[cols.length-2].w
  textFit(money0(sumSettle), x, sumY, cols[cols.length-1].w, { align: 'right', noAdvanceY: true })

  // 页尾：合作机构（银行 logo 并排，固定页尾位置）
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const publicBanksDirs = [
      path.join(__dirname, '..', '..', 'public', 'banks'),
      path.join(process.cwd?.() || '', 'public', 'banks')
    ].filter(Boolean)
    const uploadsDirs = [
      path.join(__dirname, '..', '..', 'uploads'),
      path.join(process.cwd?.() || '', 'uploads')
    ].filter(Boolean)
    const resolveIn = (dirs, rel) => {
      for (const d of dirs) {
        const p = path.join(d, rel)
        if (fs.existsSync(p)) return p
      }
      return ''
    }
  // 从 DB 优先取 logo_url；无法解析时回退到 public/banks/<bank_code>.(svg|png|jpg)
  // 若仍不可用，则添加占位符（以银行代码绘制小方框），保证布局完整
  const logos = [] // { type:'image', path } | { type:'placeholder', code }
  const seen = new Set() // 去重：image:<absPath> / placeholder:<CODE>
    const aliasMap = {
      // Malaysia common aliases
      pbb: 'public', public: 'public',
      maybank: 'maybank', mbb: 'maybank', mayb: 'maybank',
      hlb: 'hlb', hongleong: 'hlb',
      cimb: 'cimb',
      rhb: 'rhb',
      // China big five
      icbc: 'icbc',
      abc: 'abc',
      boc: 'boc',
      ccb: 'ccb',
      bcm: 'bcm',
      // Alliance (if provided in future as alliance.svg)
      abmb: 'alliance'
    }
    for (const r of items.rows) {
      let p = ''
      const codeRaw = String(r.bank_code||'').trim()
      const code = codeRaw.toLowerCase()
      const url = String(r.bank_logo_url||'').trim()
      // 解析 DB 的 logo_url
      if (url) {
        if (url.startsWith('/banks/')) {
          p = resolveIn(publicBanksDirs, url.replace('/banks/',''))
        } else if (url.startsWith('/uploads/')) {
          p = resolveIn(uploadsDirs, url.replace('/uploads/',''))
        } else if (/^https?:\/\//i.test(url)) {
          // 不请求远程资源，保持安全；改用占位符
          p = ''
        } else {
          // 视为相对文件名：优先 public/banks，其次 uploads
          p = resolveIn(publicBanksDirs, url) || resolveIn(uploadsDirs, url)
        }
      }
      // 回退：按 bank_code 映射静态资源（尝试 svg/png/jpg）；
      // 注意：若 p 已解析但文件不存在，也执行回退
      if ((!p || (p && !fs.existsSync(p))) && code) {
        const mapped = aliasMap[code] || code
        p = resolveIn(publicBanksDirs, `${mapped}.svg`) ||
            resolveIn(publicBanksDirs, `${mapped}.png`) ||
            resolveIn(publicBanksDirs, `${mapped}.jpg`)
      }
      if (p && fs.existsSync(p)) {
        const key = `image:${p}`
        if (!seen.has(key)) { seen.add(key); logos.push({ type: 'image', path: p }) }
      } else if (codeRaw) {
        const key = `placeholder:${codeRaw.toUpperCase()}`
        if (!seen.has(key)) { seen.add(key); logos.push({ type: 'placeholder', code: codeRaw.toUpperCase() }) }
      }
    }
    if (logos.length) {
      const gap = 10
  const iconH = 18 // 统一高度；宽度按比例自适应，实现“看起来是实际大小”
      // 页尺寸数据（可能新开页，需要取当前页面）
      const pLeft = doc.page.margins.left
      const pRight = doc.page.width - doc.page.margins.right
      const pWidth = pRight - pLeft

      // 计算每个元素的自然尺寸与宽高比（单位以 pt 近似）
      function getAspect(file) {
        try {
          const lower = file.toLowerCase()
          if (lower.endsWith('.svg')) {
            const svg = fs.readFileSync(file, 'utf8')
            let m = svg.match(/viewBox=["']\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i)
            if (m) {
              const w = parseFloat(m[3]); const h = parseFloat(m[4]); if (w>0 && h>0) return w/h
            }
            m = svg.match(/width=["']\s*([\d.]+)\s*(px|pt|mm|cm)?\s*["']/i)
            const m2 = svg.match(/height=["']\s*([\d.]+)\s*(px|pt|mm|cm)?\s*["']/i)
            if (m && m2) { const w = parseFloat(m[1]); const h = parseFloat(m2[1]); if (w>0 && h>0) return w/h }
            return 2
          }
          if (lower.endsWith('.png')) {
            const buf = fs.readFileSync(file)
            if (buf.length >= 24 && buf[0]===0x89 && buf[1]===0x50) {
              const w = buf.readUInt32BE(16); const h = buf.readUInt32BE(20); if (w>0 && h>0) return w/h
            }
            return 2
          }
          if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
            // 简化：不解析 SOF，使用近似比例
            return 2
          }
        } catch {}
        return 2
      }
      function getNaturalSize(file) {
        try {
          const lower = file.toLowerCase()
          if (lower.endsWith('.png')) {
            const buf = fs.readFileSync(file)
            if (buf.length >= 24 && buf[0]===0x89 && buf[1]===0x50) {
              const w = buf.readUInt32BE(16); const h = buf.readUInt32BE(20)
              if (w>0 && h>0) return { w, h }
            }
          } else if (lower.endsWith('.svg')) {
            const svg = fs.readFileSync(file, 'utf8')
            const mw = svg.match(/width=["']\s*([\d.]+)\s*(px|pt)?\s*["']/i)
            const mh = svg.match(/height=["']\s*([\d.]+)\s*(px|pt)?\s*["']/i)
            if (mw && mh) {
              const w = parseFloat(mw[1]); const h = parseFloat(mh[1])
              if (w>0 && h>0) return { w, h }
            }
          } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
            // 省略复杂 JPEG 解析：返回 undefined 以走比例推断
          }
        } catch {}
        return undefined
      }
      // 先设置字体，供占位符测宽
      const phFont = hasCJKBold ? 'CJK-Bold' : hasCJK ? 'CJK' : 'Helvetica-Bold'
      doc.font(phFont).fontSize(7)
      const visuals = logos.map(it => {
        if (it.type === 'image') {
          const nat = getNaturalSize(it.path)
          if (nat && nat.h > 0) {
            // 只在超过高度上限时缩小；不放大
            const scale = Math.min(1, iconH / nat.h)
            const drawW = Math.max(1, nat.w * scale)
            const drawH = Math.max(1, nat.h * scale)
            return { ...it, width: drawW, height: drawH, preserve: true }
          } else {
            // 无法获得自然尺寸时，按比例推断宽度，以高度上限为尺度
            const ratio = Math.max(0.3, Math.min(6, getAspect(it.path)))
            const drawW = Math.max(1, iconH * ratio)
            const drawH = iconH
            return { ...it, width: drawW, height: drawH, preserve: true }
          }
        } else {
          const txt = (it.code || '').slice(0,4)
          const w = Math.max(28, Math.min(doc.widthOfString(txt) + 10, 120))
          return { ...it, width: w, height: iconH, txt }
        }
      })

      // 依据自适应宽度进行自动换行排版
      const rowsArr = []
      let curRow = []
      let curWidth = 0
      for (const v of visuals) {
        const need = (curRow.length ? gap : 0) + v.width
        if (curRow.length && (curWidth + need > pWidth)) {
          rowsArr.push(curRow); curRow = []; curWidth = 0
        }
        curRow.push(v); curWidth += (curRow.length>1 ? gap : 0) + v.width
      }
      if (curRow.length) rowsArr.push(curRow)

      const rows = rowsArr.length
      const labelH = 12
      const footH = 4 + 1 + 6 + labelH + rows * iconH + (rows > 1 ? (rows-1)*8 : 0)
      const yBase = doc.page.height - doc.page.margins.bottom - footH
      // 若当前内容过低，可能会覆盖页尾，直接新开一页
      if (doc.y > yBase - 8) {
        doc.addPage()
      }
      const bLeft = doc.page.margins.left
      const bRight = doc.page.width - doc.page.margins.right
      const bWidth = bRight - bLeft
      const baseY = doc.page.height - doc.page.margins.bottom - footH
      // 页尾上方分隔线
      doc.moveTo(bLeft, baseY).lineTo(bRight, baseY).strokeColor('#cccccc').stroke().strokeColor('black')
      // 标题
      doc.font(hasCJKBold ? 'CJK-Bold' : hasCJK ? 'CJK' : 'Helvetica-Bold').fontSize(9)
      const label = (lang==='zh' ? '合作机构' : 'Partners')
      doc.text(label, bLeft, baseY + 6, { continued: false })
      // Logo 网格
      let logoY = baseY + 6 + labelH
      for (const row of rowsArr) {
        let logoX = bLeft
        for (const it of row) {
          try {
            if (it.type === 'image') {
              const file = it.path
              const lower = file.toLowerCase()
              if (lower.endsWith('.svg')) {
                const svg = fs.readFileSync(file, 'utf-8')
                // 传入匹配的宽高，并设置 preserveAspectRatio，避免拉伸
                SVGtoPDF(doc, svg, logoX, logoY, { assumePt: true, width: it.width, height: it.height, preserveAspectRatio: 'xMidYMid meet' })
              } else {
                // 栅格图：仅缩小，不放大；宽高与自然比例一致
                doc.image(file, logoX, logoY, { width: it.width, height: it.height })
              }
            } else if (it.type === 'placeholder') {
              doc.save()
              doc.roundedRect(logoX+0.5, logoY+0.5, it.width-1, it.height-1, 2).stroke('#cccccc')
              const txt = it.txt || (it.code||'').slice(0,4)
              const fontName = hasCJKBold ? 'CJK-Bold' : hasCJK ? 'CJK' : 'Helvetica-Bold'
              doc.font(fontName).fontSize(7)
              const w = Math.min(doc.widthOfString(txt), it.width-10)
              const h = doc.currentLineHeight()
              const tx = logoX + (it.width - w) / 2
              const ty = logoY + (it.height - h) / 2 - 1
              doc.fillColor('#666666').text(txt, tx, ty, { width: w, height: h })
              doc.fillColor('black')
              doc.restore()
            }
          } catch {}
          logoX += it.width + gap
        }
        logoY += iconH + 8
      }
      // 保持文档 y 不变（页尾绘制为浮动层）
    }
  } catch {}

  doc.end()
})

// 创建付款单
fxRouter.post('/payments', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const { customer_id, customer_name, pay_date, items = [] } = req.body || {}
  if (!customer_id || !pay_date || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'invalid payload' })
  const created_by = req.user?.id || null
  const createdAtIso = new Date().toISOString()
  const bill_no = createdAtIso.replaceAll('-', '').replaceAll(':', '').replace('.', '')
  const ins = await query(`insert into fx_payments(bill_no, customer_id, customer_name, pay_date, created_by) values($1,$2,$3,$4,$5) returning id`, [bill_no, Number(customer_id), customer_name || null, pay_date, created_by])
  const pid = ins.rows[0].id
  const values = []
  const params = []
  let idx = 1
  for (const it of items) {
    values.push(`($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`)
    params.push(pid, Number(it.account_id), it.account_name || null, it.bank_account || null, (it.currency_code || '').toUpperCase(), Number(it.amount)||0)
  }
  await query(`insert into fx_payment_items(payment_id, account_id, account_name, bank_account, currency_code, amount) values ${values.join(',')}`, params)
  res.json({ id: pid })
})

fxRouter.get('/payments', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const { customerId, startDate, endDate, page = 1, pageSize = 20 } = req.query
  const where = []
  const params = []
  let idx = 1
  if (customerId) { where.push(`p.customer_id = $${idx++}`); params.push(Number(customerId)) }
  if (startDate) { where.push(`p.pay_date >= $${idx++}`); params.push(startDate) }
  if (endDate)   { where.push(`p.pay_date <= $${idx++}`); params.push(endDate) }
  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  const total = await query(`select count(*) from fx_payments p ${whereSql}`, params)
  const offset = (Number(page)-1) * Number(pageSize)
  const rows = await query(
    `with agg as (
       select payment_id, sum(amount) as total_amount from fx_payment_items group by payment_id
     )
     select p.*, coalesce(u.display_name, u.username) as created_by_name, coalesce(a.total_amount,0) as total_amount
     from fx_payments p
     left join users u on u.id = p.created_by
     left join agg a on a.payment_id = p.id
     ${whereSql}
     order by p.id desc offset $${idx++} limit $${idx++}`,
    [...params, offset, Number(pageSize)]
  )
  res.json({ total: Number(total.rows[0].count || 0), items: rows.rows })
})

// 付款单：列表导出（按筛选），scope=all|page（默认 all）
fxRouter.get('/payments/export', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const { customerId, startDate, endDate, page = 1, pageSize = 20, scope = 'all' } = req.query
  const where = []
  const params = []
  let idx = 1
  if (customerId) { where.push(`p.customer_id = $${idx++}`); params.push(Number(customerId)) }
  if (startDate) { where.push(`p.pay_date >= $${idx++}`); params.push(startDate) }
  if (endDate)   { where.push(`p.pay_date <= $${idx++}`); params.push(endDate) }
  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  let limitSql = ''
  if (String(scope) === 'page') {
    const offset = (Number(page)-1) * Number(pageSize)
    limitSql = ` offset ${offset} limit ${Number(pageSize)}`
  }
  const rs = await query(
    `with agg as (
       select payment_id, sum(amount) as total_amount from fx_payment_items group by payment_id
     )
     select p.*, coalesce(u.display_name, u.username) as created_by_name, coalesce(a.total_amount,0) as total_amount
     from fx_payments p
     left join users u on u.id = p.created_by
     left join agg a on a.payment_id = p.id
     ${whereSql}
     order by p.id desc${limitSql}`,
    params
  )
  const header = ['Bill No','Customer ID','Customer Name','Pay Date','Total Amount','Created By','Created At']
  const rows = rs.rows.map(h => [h.bill_no||'', h.customer_id, h.customer_name||'', h.pay_date, h.total_amount, h.created_by_name||'', h.created_at])
  const csvRows = [header, ...rows]
  const csv = csvRows.map(r => r.map(v => {
    const s = v==null? '': String(v)
    return (/[",\n]/.test(s)) ? '"'+s.replace(/"/g,'""')+'"' : s
  }).join(',')).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=Payments-${Date.now()}.csv`)
  res.send('\uFEFF' + csv)
})

// 付款单：明细
fxRouter.get('/payments/:id', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const head = await query(`select p.*, coalesce(u.display_name, u.username) as created_by_name from fx_payments p left join users u on u.id=p.created_by where p.id=$1`, [id])
  if (!head.rows.length) return res.status(404).json({ error: 'not found' })
  const items = await query(`select * from fx_payment_items where payment_id=$1 order by id desc`, [id])
  res.json({ ...head.rows[0], items: items.rows })
})

// 付款单：导出 CSV
fxRouter.get('/payments/:id/export', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const head = await query(`select * from fx_payments where id=$1`, [id])
  if (!head.rows.length) return res.status(404).json({ error: 'not found' })
  const items = await query(`select * from fx_payment_items where payment_id=$1 order by id`, [id])
  const h = head.rows[0]
  const headerLines = [
    ['Payment ID', h.id],
    ['Customer ID', h.customer_id],
    ['Customer Name', h.customer_name||''],
    ['Pay Date', h.pay_date?.toISOString?.().slice(0,10) || h.pay_date || ''],
    ['Created By', h.created_by||''],
    ['Created At', h.created_at?.toISOString?.() || h.created_at || ''],
    [],
  ]
  const itemHeader = ['Account ID','Account Name','Bank Account','Currency','Amount']
  const itemRows = items.rows.map(r => [r.account_id, r.account_name||'', r.bank_account||'', r.currency_code||'', r.amount])
  const csvRows = [...headerLines, itemHeader, ...itemRows]
  const csv = csvRows.map(row => (Array.isArray(row) ? row.map(v => {
    const s = (v==null?'' : String(v))
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return '"'+s.replace(/"/g,'""')+'"'
    return s
  }).join(',') : '').toString()).join('\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename=Payment-${id}.csv`)
  res.send('\uFEFF' + csv)
})

// 删除单据
fxRouter.delete('/settlements/:id', authMiddleware(true), requirePerm('delete_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  await query('delete from fx_settlements where id=$1', [id])
  res.json({ ok: true })
})
fxRouter.delete('/payments/:id', authMiddleware(true), requirePerm('delete_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  await query('delete from fx_payments where id=$1', [id])
  res.json({ ok: true })
})
