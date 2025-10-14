import express from 'express'
import PDFDocument from 'pdfkit'
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
       b.en as bank_name_en
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
       b.en as bank_name_en
     from fx_settlement_items i
     left join fx_settlements s on s.id = i.settlement_id
     left join transactions t on t.id = i.transaction_id
     left join receiving_accounts a on a.bank_account = i.account_number
     left join banks b on b.id = a.bank_id
     where i.settlement_id = $1
     order by i.trn_date asc nulls last, i.id asc`,
    [id]
  )

  // PDF 输出
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=Settlement-${id}.pdf`)
  // A5 横版，较小页面，减小边距以获得更大内容区
  const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margins: { top: 24, bottom: 24, left: 24, right: 24 } })
  doc.pipe(res)

  const title = 'Settlement Bill'
  doc.fontSize(14).text(title, { align: 'center' })
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
    let size = max
    while (size > min) {
      doc.fontSize(size)
      const w = doc.widthOfString(String(txt||''), { width, ...opts })
      if (w <= width) break
      size -= 0.5
    }
    doc.fontSize(size)
    doc.text(String(txt||''), x, y, { width, lineBreak: false, ...opts })
  }

  const headerPairs = [
    ['Bill No', toStr(h.bill_no)],
    ['Settle Date', toDate(h.settle_date)],
    ['Rate', Number(h.rate||0).toFixed(4)],
    ['Customer Abbr', toStr(h.customer_abbr||'')],
    ['Customer Name', toStr(h.customer_name||'')],
    ['Customer Tax(%)', Number(h.customer_tax_rate||0).toFixed(2)+'%'],
    ['Pre-Settle Balance', money(pre_balance_myr)],
    ['Selected Base', money(h.total_base)],
    ['Selected Converted', money0(h.total_settled)],
    ['Created By', toStr(h.created_by_name||'')],
    ['Created At', toDate(h.created_at)]
  ]
  doc.fontSize(9)
  const hCol = Math.floor(contentWidth/2) - 8
  for (let i=0;i<headerPairs.length;i+=2) {
    const [k1,v1] = headerPairs[i]
    const [k2,v2] = headerPairs[i+1] || ['','']
    const y = doc.y
    textFit(`${k1}: ${v1}`, left, y, hCol)
    textFit(`${k2}: ${v2}`, left + hCol + 16, y, hCol)
    doc.moveDown(0.6)
  }
  doc.moveDown(0.3)
  doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke()
  doc.moveDown(0.5)

  // 表头
  const tableX = left
  const colDefs = [
    { key: '#', w: 1 },
    { key: 'Ref No', w: 3 },
    { key: 'Date', w: 3 },
    { key: 'Bank(EN)', w: 4 },
    { key: 'Account Name', w: 6 },
    { key: 'Account No', w: 4 },
    { key: 'Base', w: 3, align: 'right' },
    { key: 'Converted', w: 3, align: 'right' }
  ]
  const weightSum = colDefs.reduce((s,c)=>s+c.w,0)
  const cols = colDefs.map(c => ({ ...c, w: Math.floor(c.w/weightSum * contentWidth) }))
  let x = tableX
  doc.fontSize(9).font('Helvetica-Bold')
  cols.forEach(c => { textFit(c.key, x, doc.y, c.w, { align: c.align||'left' }); x += c.w })
  doc.moveDown(0.2)
  doc.font('Helvetica')
  doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke()

  // 行
  let idx = 1
  let sumBase = 0, sumSettle = 0
  items.rows.forEach(r => {
    const row = [
      idx++,
      toStr(r.ref_no||''),
      toDate(r.trn_date),
      toStr(r.bank_name_en||''),
      toStr(r.account_name||''),
      toStr(r.account_number||''),
      money(r.amount_base||0),
      money0(r.amount_settled_calc||0)
    ]
    x = tableX
    cols.forEach((c,i) => {
      const align = c.align||'left'
      textFit(String(row[i]??''), x, doc.y, c.w, { align })
      x += c.w
    })
    sumBase += Number(r.amount_base||0)
    sumSettle += Number(r.amount_settled_calc||0)
    doc.moveDown(0.2)
  })
  doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke()
  doc.moveDown(0.2)
  // 合计
  x = tableX + cols.slice(0,6).reduce((s,c)=>s+c.w,0)
  textFit(money(sumBase), x, doc.y, cols[6].w, { align: 'right' })
  x += cols[6].w
  textFit(money0(sumSettle), x, doc.y, cols[7].w, { align: 'right' })

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
