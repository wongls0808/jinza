import express from 'express'
import { authMiddleware, requirePerm } from './auth.js'
import { query } from './db.js'

export const fxRouter = express.Router()

async function ensureDDL() {
  await query(`
    create table if not exists fx_settlements(
      id serial primary key,
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
}

// 创建结汇单
fxRouter.post('/settlements', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  await ensureDDL()
  const { customer_id, customer_name, settle_date, rate, customer_tax_rate = 0, items = [] } = req.body || {}
  if (!customer_id || !settle_date || !rate || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'invalid payload' })
  const created_by = req.user?.id || null
  // 计算合计：基币金额（按 credit-debit）与结汇金额（基币*汇率）
  const total_base = items.reduce((s, it) => s + Number(it.amount_base||0), 0)
  const total_settled = total_base * Number(rate)
  const ins = await query(
    `insert into fx_settlements(customer_id, customer_name, settle_date, rate, customer_tax_rate, total_base, total_settled, created_by)
     values($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [Number(customer_id), customer_name || null, settle_date, Number(rate), Number(customer_tax_rate)||0, total_base, total_settled, created_by]
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

fxRouter.get('/settlements', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  await ensureDDL()
  const rs = await query(`select * from fx_settlements order by id desc limit 200`)
  res.json(rs.rows)
})

// 创建付款单
fxRouter.post('/payments', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  await ensureDDL()
  const { customer_id, customer_name, pay_date, items = [] } = req.body || {}
  if (!customer_id || !pay_date || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'invalid payload' })
  const created_by = req.user?.id || null
  const ins = await query(`insert into fx_payments(customer_id, customer_name, pay_date, created_by) values($1,$2,$3,$4) returning id`, [Number(customer_id), customer_name || null, pay_date, created_by])
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

fxRouter.get('/payments', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  await ensureDDL()
  const rs = await query(`select * from fx_payments order by id desc limit 200`)
  res.json(rs.rows)
})
