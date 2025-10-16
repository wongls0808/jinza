import express from 'express'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import crypto from 'crypto'
import SVGtoPDF from 'svg-to-pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware, requirePerm } from './auth.js'
import { query } from './db.js'

export const fxRouter = express.Router()
// 简易内存缓存（BOC抓取）
const _bocCache = { data: null, time: 0, ttl: 60 * 1000 }
// 简易内存缓存（Huaji API），按 pair 逐项缓存
const _huajiCache = { map: new Map(), ttl: 60 * 1000 }

async function ensureDDL() {
  await query(`
    create table if not exists fx_settlements(
      id serial primary key,
      bill_no varchar(40),
      customer_id int not null,
      customer_name varchar(255),
      settle_date date not null,
      rate numeric(18,6) not null,
  customer_tax_rate numeric(6,3) default 0,
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
      status varchar(20) default 'pending',
      approved_by int,
      approved_at timestamptz,
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
    -- 平台商管理
    create table if not exists fx_platforms(
      id serial primary key,
      code varchar(40) unique,
      name varchar(200) not null,
      contact varchar(200),
      active boolean default true,
      created_at timestamptz default now()
    );
    -- 汇率表（动态展示/轮询）
    create table if not exists fx_rates(
      id serial primary key,
      pair varchar(16) unique,
      rate numeric(18,6) not null,
      source varchar(64),
      updated_at timestamptz default now()
    );
    -- 购汇订单记录（轻量）
    create table if not exists fx_buy_orders(
      id serial primary key,
      order_no varchar(40),
      platform_id int references fx_platforms(id) on delete set null,
      customer_id int references customers(id) on delete set null,
      customer_name varchar(255),
      pay_currency varchar(8) not null,
      buy_currency varchar(8) not null,
      amount_pay numeric(18,2) not null,
      expected_rate numeric(18,6),
      created_by int,
      created_at timestamptz default now()
    );
    -- 平台内币种互换记录
    create table if not exists fx_platform_fx_transfers(
      id serial primary key,
      platform_id int not null references fx_platforms(id) on delete cascade,
      from_currency varchar(8) not null,
      to_currency varchar(8) not null,
      amount_from numeric(18,6) not null,
      rate numeric(18,6) not null,
  fee_percent numeric(8,4) default 0,
      fee_amount numeric(18,6) default 0,
      amount_to numeric(18,6) not null,
      balance_src_before numeric(18,6),
      balance_dst_before numeric(18,6),
      balance_src_after numeric(18,6),
      balance_dst_after numeric(18,6),
      note varchar(200),
      created_by int,
      created_at timestamptz default now()
    );
  `)
  // 向后兼容：老表补充 bill_no 列
  await query(`alter table fx_settlements add column if not exists bill_no varchar(40)`)
  await query(`alter table fx_payments add column if not exists bill_no varchar(40)`)
  await query(`alter table fx_payments add column if not exists status varchar(20) default 'pending'`)
  await query(`alter table fx_payments add column if not exists approved_by int`)
  await query(`alter table fx_payments add column if not exists approved_at timestamptz`)
  // 付款单：审核后从平台商余额扣减所需字段
  try { await query(`alter table fx_payments add column if not exists platform_id int references fx_platforms(id)`) } catch {}
  try { await query(`alter table fx_payments add column if not exists platform_fee_percent numeric(8,4) default 0`) } catch {}
  try { await query(`alter table fx_payments add column if not exists platform_fee_amount numeric(18,2) default 0`) } catch {}
  // 审核日志
  try {
    await query(`
      create table if not exists fx_payment_audits(
        id serial primary key,
        payment_id int not null references fx_payments(id) on delete cascade,
        action varchar(20) not null, -- approve | unapprove
        platform_id int references fx_platforms(id),
  fee_percent numeric(8,4) default 0,
        fee_amount numeric(18,2) default 0,
        deltas jsonb, -- { "MYR": { amount: 100.00, fee: 0.50, total: 100.50 }, ... }
        acted_by int,
        acted_at timestamptz default now()
      );
    `)
  } catch {}
  try { await query(`alter table fx_settlements alter column customer_tax_rate type numeric(6,3) using round(coalesce(customer_tax_rate,0)::numeric, 3)`) } catch {}
  // 平台商表补充字段（登录网址、三币余额、支付手续费%）
  try { await query(`alter table fx_platforms add column if not exists login_url varchar(500)`) } catch {}
  try { await query(`alter table fx_platforms add column if not exists balance_usd numeric(18,2) default 0`) } catch {}
  try { await query(`alter table fx_platforms add column if not exists balance_myr numeric(18,2) default 0`) } catch {}
  try { await query(`alter table fx_platforms add column if not exists balance_cny numeric(18,2) default 0`) } catch {}
  try { await query(`alter table fx_platforms add column if not exists fee_percent numeric(8,4) default 0`) } catch {}
  // 升级已存在列到4位小数（保留现有数值，四舍五入到4位）
  try { await query(`alter table fx_platforms alter column fee_percent type numeric(8,4) using round(coalesce(fee_percent,0)::numeric, 4)`) } catch {}
  try { await query(`alter table fx_payments alter column platform_fee_percent type numeric(8,4) using round(coalesce(platform_fee_percent,0)::numeric, 4)`) } catch {}
  try { await query(`alter table fx_platform_fx_transfers alter column fee_percent type numeric(8,4) using round(coalesce(fee_percent,0)::numeric, 4)`) } catch {}
  try { await query(`alter table fx_payment_audits alter column fee_percent type numeric(8,4) using round(coalesce(fee_percent,0)::numeric, 4)`) } catch {}
  // 转换记录表补充余额快照列
  try { await query(`alter table fx_platform_fx_transfers add column if not exists balance_src_before numeric(18,6)`) } catch {}
  try { await query(`alter table fx_platform_fx_transfers add column if not exists balance_dst_before numeric(18,6)`) } catch {}
  try { await query(`alter table fx_platform_fx_transfers add column if not exists balance_src_after numeric(18,6)`) } catch {}
  try { await query(`alter table fx_platform_fx_transfers add column if not exists balance_dst_after numeric(18,6)`) } catch {}
}

// ---------- 平台商管理 ----------
fxRouter.get('/platforms', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const rs = await query(`select * from fx_platforms order by id desc`)
  res.json({ items: rs.rows })
})
fxRouter.post('/platforms', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const { id, code, name, contact, active, login_url, balance_usd, balance_myr, balance_cny, fee_percent } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  if (id) {
    const rs = await query(`
      update fx_platforms
         set code = coalesce($1, code),
             name = $2,
             contact = $3,
             active = coalesce($4, active),
             login_url = $6,
             balance_usd = $7,
             balance_myr = $8,
             balance_cny = $9,
             fee_percent = $10
       where id = $5
       returning *
    `,
    [
      code||null,
      name,
      contact||null,
      (active==null? null : !!active),
      Number(id),
      login_url||null,
      (balance_usd==null? null : Number(balance_usd)),
      (balance_myr==null? null : Number(balance_myr)),
      (balance_cny==null? null : Number(balance_cny)),
      (fee_percent==null? null : Number(fee_percent))
    ])
    if (!rs.rowCount) return res.status(404).json({ error: 'not found' })
    return res.json(rs.rows[0])
  } else {
    const rs = await query(`
      insert into fx_platforms(code, name, contact, active, login_url, balance_usd, balance_myr, balance_cny, fee_percent)
      values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *
    `, [
      code||null,
      name,
      contact||null,
      !!active,
      login_url||null,
      (balance_usd==null? null : Number(balance_usd)),
      (balance_myr==null? null : Number(balance_myr)),
      (balance_cny==null? null : Number(balance_cny)),
      (fee_percent==null? null : Number(fee_percent))
    ])
    return res.json(rs.rows[0])
  }
})
fxRouter.delete('/platforms/:id', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  await query(`delete from fx_platforms where id=$1`, [id])
  res.json({ ok: true })
})

// ---------- 汇率（已停用） ----------
fxRouter.get('/rates', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  return res.status(410).json({ error: 'rates disabled' })
})
fxRouter.post('/rates', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  return res.status(410).json({ error: 'rates disabled' })
})

// ---------- 购汇下单（记录） ----------
fxRouter.get('/buy', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const rs = await query(`select b.*, p.name as platform_name from fx_buy_orders b left join fx_platforms p on p.id=b.platform_id order by id desc limit 200`)
  res.json({ items: rs.rows })
})
fxRouter.post('/buy', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const { platform_id, customer_id, customer_name, pay_currency='CNY', buy_currency='MYR', amount_pay, expected_rate } = req.body || {}
  if (!amount_pay || Number(amount_pay) <= 0) return res.status(400).json({ error: 'amount_pay required' })
  const created_by = req.user?.id || null
  const order_no = new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace('.', '')
  const rs = await query(`
    insert into fx_buy_orders(order_no, platform_id, customer_id, customer_name, pay_currency, buy_currency, amount_pay, expected_rate, created_by)
    values($1,$2,$3,$4,upper($5),upper($6),$7,$8,$9) returning *
  `, [order_no, platform_id||null, customer_id||null, customer_name||null, pay_currency, buy_currency, Number(amount_pay), (expected_rate==null? null : Number(expected_rate)), created_by])
  res.json(rs.rows[0])
})

// ---------- 平台内币种互换（余额相互购汇） ----------
fxRouter.post('/platforms/:id/convert', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  const { from_currency, to_currency, amount_from, rate, note } = req.body || {}
  if (!id) return res.status(400).json({ error: 'invalid platform id' })
  const from = String(from_currency||'').toUpperCase()
  const to = String(to_currency||'').toUpperCase()
  const amt = Number(amount_from||0)
  const r = Number(rate||0)
  const okCurr = new Set(['USD','MYR','CNY'])
  if (!okCurr.has(from) || !okCurr.has(to) || from === to) return res.status(400).json({ error: 'invalid currency' })
  if (!(amt > 0) || !(r > 0)) return res.status(400).json({ error: 'invalid amount/rate' })

  // 获取平台与费率
  const pr = await query('select id, fee_percent, balance_usd, balance_myr, balance_cny from fx_platforms where id=$1', [id])
  if (!pr.rowCount) return res.status(404).json({ error: 'platform not found' })
  const p = pr.rows[0]
  // 根据最新需求：购汇不计手续费
  const feePercent = 0
  const fee = 0
  // 平台余额精度为两位小数，这里对更新量统一取两位，保证删除时可精确回滚
  const debitTotal = Math.round(amt * 100) / 100
  const creditTo = Math.round((amt * r) * 100) / 100
  const srcField = from === 'USD' ? 'balance_usd' : (from === 'MYR' ? 'balance_myr' : 'balance_cny')
  const dstField = to === 'USD' ? 'balance_usd' : (to === 'MYR' ? 'balance_myr' : 'balance_cny')

  // 充足性校验
  const currentSrc = Number(p[srcField]||0)
  if (currentSrc < debitTotal) {
    return res.status(400).json({ error: 'insufficient balance', detail: { required: debitTotal, current: currentSrc, currency: from } })
  }

  // 原子更新：事务
  try {
    await query('begin')
    // 计算交易前余额
    const srcBefore = Number(p[srcField]||0)
    const dstBefore = Number(p[dstField]||0)
    const srcAfter = Math.round((srcBefore - debitTotal) * 100) / 100
    const dstAfter = Math.round((dstBefore + creditTo) * 100) / 100
    // 更新平台余额
    await query(`update fx_platforms set ${srcField} = $1, ${dstField} = $2 where id=$3`, [srcAfter, dstAfter, id])
    // 写记录（包含前后余额）
    await query(
      `insert into fx_platform_fx_transfers(
        platform_id, from_currency, to_currency, amount_from, rate, fee_percent, fee_amount, amount_to,
        balance_src_before, balance_dst_before, balance_src_after, balance_dst_after, note, created_by)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [id, from, to, debitTotal, r, feePercent, fee, creditTo,
       srcBefore, dstBefore, srcAfter, dstAfter, (note||null), req.user?.id || null]
    )
    await query('commit')
    res.json({ ok: true, balances: { id, balance_usd: (from==='USD'||to==='USD')? (from==='USD'?srcAfter:dstAfter) : Number(p.balance_usd||0), balance_myr: (from==='MYR'||to==='MYR')? (from==='MYR'?srcAfter:dstAfter) : Number(p.balance_myr||0), balance_cny: (from==='CNY'||to==='CNY')? (from==='CNY'?srcAfter:dstAfter) : Number(p.balance_cny||0) }, fee_amount: fee, amount_to: creditTo })
  } catch (e) {
    await query('rollback')
    console.error('platform convert failed', e)
    res.status(500).json({ error: 'convert failed', detail: e.message })
  }
})

// ---------- Huaji 汇率服务（已停用） ----------
fxRouter.get('/rates/huaji', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  return res.status(410).json({ error: 'rates disabled' })
})

// ---------- 平台购汇历史（转换记录） ----------
// 列表（最近200条）
fxRouter.get('/transfers', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const rs = await query(`
    select t.*, p.name as platform_name, coalesce(u.display_name,u.username) as created_by_name
    from fx_platform_fx_transfers t
    left join fx_platforms p on p.id = t.platform_id
    left join users u on u.id = t.created_by
    order by t.id desc
    limit 200
  `)
  res.json({ items: rs.rows })
})

// 更新备注（安全起见，仅允许编辑备注）
fxRouter.put('/transfers/:id', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const { note, from_currency, to_currency, amount_from, rate } = req.body || {}

  // 若仅有备注，保持轻量更新
  const hasEdit = (from_currency!=null) || (to_currency!=null) || (amount_from!=null) || (rate!=null)
  if (!hasEdit) {
    const rs = await query(`update fx_platform_fx_transfers set note = $1 where id = $2 returning *`, [note||null, id])
    if (!rs.rowCount) return res.status(404).json({ error: 'not found' })
    return res.json(rs.rows[0])
  }

  // 完整编辑：回滚旧影响 -> 应用新影响 -> 更新记录与快照
  const tr = await query(`select * from fx_platform_fx_transfers where id=$1`, [id])
  if (!tr.rowCount) return res.status(404).json({ error: 'not found' })
  const old = tr.rows[0]

  // 新值与校验
  const from = String((from_currency ?? old.from_currency) || '').toUpperCase()
  const to = String((to_currency ?? old.to_currency) || '').toUpperCase()
  const amt = Number((amount_from ?? old.amount_from) || 0)
  const r = Number((rate ?? old.rate) || 0)
  const okCurr = new Set(['USD','MYR','CNY'])
  if (!okCurr.has(from) || !okCurr.has(to) || from === to) return res.status(400).json({ error: 'invalid currency' })
  if (!(amt > 0) || !(r > 0)) return res.status(400).json({ error: 'invalid amount/rate' })

  // 统一两位小数的借/贷对平台影响
  const debitTotal = Math.round(amt * 100) / 100
  const creditTo = Math.round((amt * r) * 100) / 100

  const oldSrcField = old.from_currency === 'USD' ? 'balance_usd' : (old.from_currency === 'MYR' ? 'balance_myr' : 'balance_cny')
  const oldDstField = old.to_currency === 'USD' ? 'balance_usd' : (old.to_currency === 'MYR' ? 'balance_myr' : 'balance_cny')
  const newSrcField = from === 'USD' ? 'balance_usd' : (from === 'MYR' ? 'balance_myr' : 'balance_cny')
  const newDstField = to === 'USD' ? 'balance_usd' : (to === 'MYR' ? 'balance_myr' : 'balance_cny')

  try {
    await query('begin')
    // 锁住平台行，避免并发
    const plat = await query(`select id, balance_usd, balance_myr, balance_cny from fx_platforms where id=$1 for update`, [old.platform_id])
    if (!plat.rowCount) { await query('rollback'); return res.status(404).json({ error: 'platform not found' }) }
    let p = plat.rows[0]

    // 回滚旧影响：优先按快照差值
    const hasSnap = old.balance_src_before != null && old.balance_dst_before != null && old.balance_src_after != null && old.balance_dst_after != null
    if (hasSnap) {
      const deltaSrc = Number(old.balance_src_after) - Number(old.balance_src_before)
      const deltaDst = Number(old.balance_dst_after) - Number(old.balance_dst_before)
      const ps = Number(p[oldSrcField]||0) - deltaSrc
      const pd = Number(p[oldDstField]||0) - deltaDst
      await query(`update fx_platforms set ${oldSrcField} = round($1,2), ${oldDstField} = round($2,2) where id=$3`, [ps, pd, old.platform_id])
      p[oldSrcField] = Math.round(ps * 100) / 100
      p[oldDstField] = Math.round(pd * 100) / 100
    } else {
      const addBack = Math.round(Number(old.amount_from||0) * 100) / 100
      const minusBack = Math.round(Number(old.amount_to||0) * 100) / 100
      const ps = Number(p[oldSrcField]||0) + addBack
      const pd = Number(p[oldDstField]||0) - minusBack
      await query(`update fx_platforms set ${oldSrcField} = round($1,2), ${oldDstField} = round($2,2) where id=$3`, [ps, pd, old.platform_id])
      p[oldSrcField] = Math.round(ps * 100) / 100
      p[oldDstField] = Math.round(pd * 100) / 100
    }

    // 读取回滚后的最新余额作为新的 before 快照
    const lock2 = await query(`select id, balance_usd, balance_myr, balance_cny from fx_platforms where id=$1 for update`, [old.platform_id])
    if (!lock2.rowCount) { await query('rollback'); return res.status(404).json({ error: 'platform not found' }) }
    p = lock2.rows[0]
    const srcBefore = Number(p[newSrcField]||0)
    const dstBefore = Number(p[newDstField]||0)
    // 充足性校验
    if (srcBefore < debitTotal) {
      await query('rollback')
      return res.status(400).json({ error: 'insufficient balance', detail: { required: debitTotal, current: srcBefore, currency: from } })
    }
    const srcAfter = Math.round((srcBefore - debitTotal) * 100) / 100
    const dstAfter = Math.round((dstBefore + creditTo) * 100) / 100
    // 应用新影响
    await query(`update fx_platforms set ${newSrcField} = $1, ${newDstField} = $2 where id=$3`, [srcAfter, dstAfter, old.platform_id])
    // 更新记录
    const upd = await query(`
      update fx_platform_fx_transfers
         set from_currency=$1, to_currency=$2, amount_from=$3, rate=$4, amount_to=$5,
             balance_src_before=$6, balance_dst_before=$7, balance_src_after=$8, balance_dst_after=$9,
             note=$10
       where id=$11
       returning *
    `, [from, to, amt, r, creditTo, srcBefore, dstBefore, srcAfter, dstAfter, (note||null), id])
    await query('commit')
    return res.json(upd.rows[0])
  } catch (e) {
    await query('rollback')
    console.error('update transfer failed', e)
    return res.status(500).json({ error: 'update failed', detail: e.message })
  }
})

// 删除记录并回滚平台余额
fxRouter.delete('/transfers/:id', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const rs = await query(`select * from fx_platform_fx_transfers where id=$1`, [id])
  if (!rs.rowCount) return res.status(404).json({ error: 'not found' })
  const row = rs.rows[0]
  const srcField = row.from_currency === 'USD' ? 'balance_usd' : (row.from_currency === 'MYR' ? 'balance_myr' : 'balance_cny')
  const dstField = row.to_currency === 'USD' ? 'balance_usd' : (row.to_currency === 'MYR' ? 'balance_myr' : 'balance_cny')
  try {
    await query('begin')
    const hasSnap = row.balance_src_before != null && row.balance_dst_before != null && row.balance_src_after != null && row.balance_dst_after != null
    if (hasSnap) {
      const deltaSrc = Number(row.balance_src_after) - Number(row.balance_src_before) // 负数
      const deltaDst = Number(row.balance_dst_after) - Number(row.balance_dst_before) // 正数
      await query(
        `update fx_platforms set ${srcField} = round(coalesce(${srcField},0) - $1, 2), ${dstField} = round(coalesce(${dstField},0) - $2, 2) where id=$3`,
        [deltaSrc, deltaDst, Number(row.platform_id)]
      )
    } else {
      const addBack = Math.round(Number(row.amount_from||0) * 100) / 100
      const minusBack = Math.round(Number(row.amount_to||0) * 100) / 100
      await query(
        `update fx_platforms set ${srcField} = round(coalesce(${srcField},0) + $1, 2), ${dstField} = round(coalesce(${dstField},0) - $2, 2) where id=$3`,
        [addBack, minusBack, Number(row.platform_id)]
      )
    }
    await query(`delete from fx_platform_fx_transfers where id=$1`, [id])
    await query('commit')
    res.json({ ok: true })
  } catch (e) {
    await query('rollback')
    console.error('delete transfer failed', e)
    res.status(500).json({ error: 'delete failed', detail: e.message })
  }
})

// ---------- 平台支出（来源：付款单审批扣减日志 fx_payment_audits） ----------
fxRouter.get('/platforms/:id/expenses', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid platform id' })
  const { currency, startDate, endDate, page = 1, pageSize = 50 } = req.query || {}
  const where = [ `a.action = 'approve'`, `a.platform_id = $1` ]
  const params = [ id ]
  let idx = 2
  if (currency) { where.push(`upper(k.key) = $${idx++}`); params.push(String(currency).toUpperCase()) }
  if (startDate) { where.push(`a.acted_at >= $${idx++}`); params.push(startDate) }
  if (endDate) { where.push(`a.acted_at <= $${idx++}`); params.push(endDate) }
  const whereSql = 'where ' + where.join(' and ')
  const offset = (Number(page)-1) * Number(pageSize)

  const total = await query(
    `select count(*) from (
       select 1
       from fx_payment_audits a
       join fx_payments p on p.id = a.payment_id
       cross join lateral jsonb_each(a.deltas) as k(key, value)
       ${whereSql}
     ) t`, params)
  const rows = await query(
    `select 
       a.payment_id,
       p.bill_no,
       p.customer_id,
       p.customer_name,
       a.acted_at,
       a.fee_percent,
       a.fee_amount,
       upper(k.key) as currency,
       coalesce((k.value->>'amount')::numeric, 0) as amount,
       coalesce((k.value->>'fee')::numeric, 0) as fee,
       coalesce((k.value->>'total')::numeric, 0) as total
     from fx_payment_audits a
     join fx_payments p on p.id = a.payment_id
     cross join lateral jsonb_each(a.deltas) as k(key, value)
     ${whereSql}
     order by a.acted_at desc, a.payment_id desc
     offset $${idx++} limit $${idx++}`,
     [ ...params, offset, Number(pageSize) ]
  )
  res.json({ total: Number(total.rows?.[0]?.count || 0), items: rows.rows })
})

// ---------- 平台统一借贷账目（互换=买/卖 + 审批支出=支出） ----------
fxRouter.get('/platforms/:id/ledger', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  try {
    await ensureDDL()
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'invalid platform id' })
  const { currency, startDate, endDate, page = 1, pageSize = 100 } = req.query || {}
    const where = [ `platform_id = $1` ]
    // 构建公共筛选条件：在外层再按 currency/date 过滤
    const params = [ id ]
    let idx = 2
    const more = []
  if (currency) { more.push(`upper(currency) = $${idx++}`); params.push(String(currency).toUpperCase()) }
  if (startDate) { more.push(`ts::date >= $${idx++}::date`); params.push(startDate) }
  if (endDate) { more.push(`ts::date <= $${idx++}::date`); params.push(endDate) }
    const moreSql = more.length ? ('where ' + more.join(' and ')) : ''
    const offset = (Number(page)-1) * Number(pageSize)

  const sqlBase = `
    with xfer as (
      select id, created_at as ts, from_currency, to_currency, amount_from, amount_to, fee_amount, note, platform_id
        from fx_platform_fx_transfers
       where platform_id = $1
  ),
    xfer_debit as (
      select ts, 'transfer'::text as source, 'sell'::text as action,
             upper(from_currency) as currency,
             round(coalesce(amount_from,0)::numeric, 2)::numeric(18,2) as debit,
             0::numeric(18,2) as credit,
             id as ref_id,
             null::text as ref_no,
             note,
             platform_id
        from xfer
  ),
    xfer_credit as (
      select ts, 'transfer'::text as source, 'buy'::text as action,
             upper(to_currency) as currency,
             0::numeric(18,2) as debit,
             round(coalesce(amount_to,0)::numeric, 2)::numeric(18,2) as credit,
             id as ref_id,
             null::text as ref_no,
             note,
             platform_id
        from xfer
    ),
    -- 交易管理中匹配到平台商（match_type='buyfx'）的收支：
    -- 规则：交易借方(debit_amount)表示平台贷方(credit)；交易贷方(credit_amount)表示平台借方(debit)
    txn as (
      select 
        t.transaction_date::timestamptz as ts,
        'transaction'::text as source,
        case when coalesce(t.debit_amount,0) > 0 then 'income' else 'outcome' end as action,
        upper(a.currency_code) as currency,
        round(coalesce(t.credit_amount,0)::numeric, 2)::numeric(18,2) as debit,
        round(coalesce(t.debit_amount,0)::numeric, 2)::numeric(18,2) as credit,
        t.id as ref_id,
        coalesce(t.cheque_ref_no, t.reference_1, t.reference_2, t.reference_3)::text as ref_no,
        t.description::text as note,
        t.match_target_id as platform_id
      from transactions t
      left join receiving_accounts a on a.bank_account = t.account_number
      where coalesce(t.matched,false) = true and lower(t.match_type) = 'buyfx' and t.match_target_id = $1
    ),
    exp as (
      select 
             a.acted_at as ts,
             'expense'::text as source,
             'expense'::text as action,
             upper(k.key) as currency,
             (
               case when (k.value->>'total') ~ '^[+-]?[0-9]+(\\.[0-9]+)?$'
                    then round(((k.value->>'total')::numeric), 2)::numeric(18,2)
                    else 0::numeric(18,2)
               end
             ) as debit,
             0::numeric(18,2) as credit,
             a.payment_id as ref_id,
             p.bill_no::text as ref_no,
             p.customer_name::text as note,
             a.platform_id
        from fx_payment_audits a
        join fx_payments p on p.id = a.payment_id
     cross join lateral jsonb_each(
    case when jsonb_typeof(coalesce(a.deltas, '{}'::jsonb)) = 'object'
      then coalesce(a.deltas, '{}'::jsonb)
      else '{}'::jsonb
    end
     ) as k(key, value)
     where a.platform_id = $1 and a.action = 'approve'
    ),
    all_rows as (
      select * from xfer_debit
      union all
      select * from xfer_credit
      union all
      select * from txn
      union all
      select * from exp
    )
    select 
      *,
      sum(credit - debit) over (partition by platform_id, currency order by ts, ref_id) as balance
    from all_rows
  `

    const total = await query(
      `select count(*) from (${sqlBase}) z ${moreSql}`,
      params
    )
    // 为 offset/limit 追加两个占位参数号（基于前面的 idx 计数）
    const rows = await query(
      `select * from (${sqlBase}) z ${moreSql} order by ts desc, ref_id desc offset $${idx} limit $${idx+1}`,
      [ ...params, offset, Number(pageSize) ]
    )
    res.json({ total: Number(total.rows?.[0]?.count || 0), items: rows.rows })
  } catch (e) {
    console.error('ledger error', e)
    // 将错误 message 合并到 error 字段，便于前端直接展示定位
    const msg = e?.message || String(e)
    res.status(500).json({ error: `ledger failed: ${msg}`, detail: msg })
  }
})

// ---------- 中国银行挂牌价（银行买入价） ----------
// 支持 pair: USD/CNY, MYR/CNY, MYR/USD（或使用连字符）
fxRouter.get('/rates/boc', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  const raw = String(req.query.pair || '').toUpperCase().replace('-', '/')
  const allowed = new Set(['USD/CNY','MYR/CNY','MYR/USD','USD/MYR'])
  if (!allowed.has(raw)) return res.status(400).json({ error: 'invalid pair' })

  try {
    const now = Date.now()
    if (!_bocCache.data || (now - _bocCache.time) > _bocCache.ttl) {
      // 抓取英文页，失败则回退中文页
      const fetchHtml = async (url) => {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return await r.text()
      }
      let html = ''
      try {
        html = await fetchHtml('https://www.boc.cn/sourcedb/whpj/enindex.html')
      } catch {
        html = await fetchHtml('https://www.boc.cn/sourcedb/whpj/')
      }
      // 解析表格，抽取 USD 与 MYR 行的 Buying Rate 与单位
      const clean = (s) => String(s||'').replace(/\r|\n|\t/g,' ').replace(/\s{2,}/g,' ').trim()
      const getEnglishRow = (codeOrName) => {
        const rx = new RegExp(`<tr[^>]*>\\s*<td[^>]*>(?:${codeOrName})<\\/td>[\\s\\S]*?<\\/tr>`, 'i')
        const m = rx.exec(html)
        return m ? m[0] : ''
      }
      const getChineseRow = (zhName) => {
        const rx = new RegExp(`<tr[^>]*>[\\s\\S]*?${zhName}[\\s\\S]*?<\\/tr>`, 'i')
        const m = rx.exec(html)
        return m ? m[0] : ''
      }
      const pickCellNumbers = (rowHtml) => {
        // 依次提取单元格文本
        const cells = Array.from(rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map(x=>clean(x[1]))
        return cells
      }
      let rowUSD = getEnglishRow('US\\s*Dollar') || getChineseRow('美元')
      let rowMYR = getEnglishRow('Malaysian\\s*Ringgit') || getChineseRow('马来西亚林吉特')
      // 兼容英文页可能只出现代码
      if (!rowUSD) rowUSD = getEnglishRow('USD')
      if (!rowMYR) rowMYR = getEnglishRow('MYR')
      const cellsUSD = rowUSD ? pickCellNumbers(rowUSD) : []
      const cellsMYR = rowMYR ? pickCellNumbers(rowMYR) : []
      // 买入价与单位的列位置：英文页常见列顺序 [Currency, Buying Rate, Cash Buying, Selling Rate, Middle Rate, Pub Time, Unit]
      const parseRateUnit = (cells) => {
        if (!cells.length) return null
        // 尝试在 cells 找到数字最大的可能为 Buying Rate；再找 Unit
        // 更稳妥：优先按已知列位取值
        // 英文页：Buying Rate 可能在 index 1，Unit 在最后一列
        let unit = Number(cells[cells.length-1].replace(/[^0-9.]/g,'')) || 1
        let rate = Number(cells[1]?.replace(/[^0-9.]/g,''))
        if (!isFinite(rate)) {
          // 中文页：列顺序一般为 [货币名称, 现汇买入价, 现钞买入价, 现汇卖出价, 现钞卖出价, 中行折算价, 发布时间]
          rate = Number(cells[1]?.replace(/[^0-9.]/g,''))
          unit = 1
        }
        if (!isFinite(rate) || rate<=0) return null
        if (!isFinite(unit) || unit<=0) unit = 1
        return { rate, unit }
      }
      const ruUSD = parseRateUnit(cellsUSD)
      const ruMYR = parseRateUnit(cellsMYR)
      if (!ruUSD || !ruMYR) throw new Error('parse boc failed')
      // 标准化为“每 1 单位外币 = X CNY”的买入价
      const usd_cny = ruUSD.rate / ruUSD.unit
      const myr_cny = ruMYR.rate / ruMYR.unit
      _bocCache.data = { 'USD/CNY': usd_cny, 'MYR/CNY': myr_cny }
      _bocCache.time = now
    }
    const usd_cny = _bocCache.data['USD/CNY']
    const myr_cny = _bocCache.data['MYR/CNY']
    let out = null
    if (raw === 'USD/CNY') out = usd_cny
    else if (raw === 'MYR/CNY') out = myr_cny
    else if (raw === 'MYR/USD') out = myr_cny / usd_cny
    else if (raw === 'USD/MYR') out = usd_cny / myr_cny
    res.json({ pair: raw, rate: Number(out) })
  } catch (e) {
    console.error('boc rate failed', e)
    res.status(500).json({ error: 'boc rate failed', detail: e.message })
  }
})

// 创建结汇单
fxRouter.post('/settlements', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const { customer_id, customer_name, settle_date, rate, items = [] } = req.body || {}
  if (!customer_id || !settle_date || !rate || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'invalid payload' })
  const created_by = req.user?.id || null
  // 生成单号：基于 created_at ISO 字符串去除冒号与连字符，保留 T
  const createdAtIso = new Date().toISOString()
  // 例：2025-10-13T14:27:01.103Z -> 20251013T142701103Z
  const bill_no = createdAtIso.replaceAll('-', '').replaceAll(':', '').replace('.', '')
  // 查询客户最新税率（百分比p，0-100），计算实际系数 factor = 1 - p/100；
  // 兼容历史：仅当 0<raw<1 时将其视为系数 f，换算 p=(1-f)*100；raw=0 或 raw=1 视为 0%/1% 的百分比。
  let taxFactor = 0
  let taxPercent = 0
  try {
    const crs = await query('select tax_rate from customers where id=$1', [Number(customer_id)])
    if (crs.rowCount) {
      const raw = Number(crs.rows[0].tax_rate || 0)
      let p = isFinite(raw) ? raw : 0
      if (p < 0) p = 0
      // 仅在 0<raw<1 时将其视为系数，其他 0 或 >=1 都按百分比处理
      if (p > 0 && p < 1) {
        p = (1 - p) * 100
      }
      // 计算实际系数
      let f = 1 - p / 100
      // 边界修正
      if (f < 0) f = 0
      if (f > 1) f = 1
      f = Math.round(f * 1000) / 1000
      p = Math.round(p * 1000) / 1000
      taxFactor = f
      taxPercent = p
    }
  } catch {}

  // 计算合计：马币金额（按 credit-debit）与结汇金额（基数×税率×汇率）
  const total_base = items.reduce((s, it) => s + Number(it.amount_base||0), 0)
  const total_settled = items.reduce((s, it) => s + Math.round(Number(it.amount_base||0) * Number(rate||0) * taxFactor), 0)
  const ins = await query(
    `insert into fx_settlements(bill_no, customer_id, customer_name, settle_date, rate, customer_tax_rate, total_base, total_settled, created_by)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
    // 头部 customer_tax_rate 存储百分比 p，便于展示和导出
    [bill_no, Number(customer_id), customer_name || null, settle_date, Number(rate), taxPercent, total_base, total_settled, created_by]
  )
  const sid = ins.rows[0].id
  // 批量写入明细
  if (items.length) {
    const values = []
    const params = []
    let idx = 1
    for (const it of items) {
      const base = Number(it.amount_base) || 0
      const settled = Math.round(base * Number(rate || 0) * taxFactor)
      values.push(`($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`)
      params.push(sid, Number(it.transaction_id), it.account_number || null, it.trn_date || null, base, settled)
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
  // 详情头部：补充 customer_abbr 与 pre_balance_myr（同列表口径：期初 + 已匹配MYR净额 - 之前结汇马币合计）
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
  // 明细：联表获取原始参考号、银行名称、账户名，并计算每行折算金额（若存量为0则用马币*汇率）
  const items = await query(
    `select 
       i.id,
       i.transaction_id,
       i.account_number,
       i.trn_date,
  i.amount_base,
  case when coalesce(i.amount_settled,0) = 0 then round(
    i.amount_base * s.rate * (case when coalesce(s.customer_tax_rate,0) <= 1 then coalesce(s.customer_tax_rate,0) else (1 - coalesce(s.customer_tax_rate,0)/100) end)
  , 0) else i.amount_settled end as amount_settled_calc,
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
  ['Customer Tax Rate', Number(h.customer_tax_rate||0).toFixed(3)],
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
      selectedBase: '已选马币合计',
      selectedConverted: '已选折算合计',
      createdBy: '创建人',
      createdAt: '创建时间',
      thIndex: '序号',
      thRefNo: '参考号',
      thDate: '日期',
  thBankEn: '银行',
      thAccountName: '账户名',
      thAccountNo: '账号',
      thBase: '马币',
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
  case when coalesce(i.amount_settled,0) = 0 then round(
    i.amount_base * s.rate * (case when coalesce(s.customer_tax_rate,0) <= 1 then coalesce(s.customer_tax_rate,0) else (1 - coalesce(s.customer_tax_rate,0)/100) end)
  , 0) else i.amount_settled end as amount_settled_calc,
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
  [t('customerTax'), Number(h.customer_tax_rate||0).toFixed(3)+'%'],
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
      path.join(process.env.DATA_DIR || '', 'uploads'),
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
  // 调整“合作机构”区域的垂直留白，避免和 LOGO 视觉粘连
  const labelH = 12
  const labelToLogosGap = 8 // 标题与首行 LOGO 的间距稍作增加
  const sectionTopGap = 6   // 分隔线和标题之间
  const sectionBottomGap = 4 // LOGO 网格与页底之间
  const rowGap = 8
  const footH = sectionBottomGap + sectionTopGap + labelH + labelToLogosGap + rows * iconH + (rows > 1 ? (rows-1)*rowGap : 0)
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
      doc.text(label, bLeft, baseY + sectionTopGap, { continued: false })
      // Logo 网格
      let logoY = baseY + sectionTopGap + labelH + labelToLogosGap
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
        logoY += iconH + rowGap
      }
      // 保持文档 y 不变（页尾绘制为浮动层）
    }
  } catch {}

  doc.end()
})

// 创建付款单
fxRouter.post('/payments', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const { customer_id, customer_name, pay_date, items = [], split = true } = req.body || {}
  if (!customer_id || !pay_date || !Array.isArray(items) || !items.length) return res.status(400).json({ error: 'invalid payload' })
  const created_by = req.user?.id || null

  // 读取客户当前 CNY 余额，用于金额截断（余额不足时自动按顺序分配）
  let balanceCny = 0
  try {
    const rs = await query(`
      with tx_agg as (
        select 
          t.match_target_id as customer_id,
          upper(a.currency_code) as currency,
          sum(coalesce(t.credit_amount,0) - coalesce(t.debit_amount,0)) as net
        from transactions t
        left join receiving_accounts a on a.bank_account = t.account_number
        where coalesce(t.matched,false) = true and t.match_type = 'customer'
        group by t.match_target_id, upper(a.currency_code)
      ), tx_pivot as (
        select customer_id,
               sum(case when currency = 'CNY' then net else 0 end) as net_cny
        from tx_agg group by customer_id
      ), fx_set as (
        select customer_id, sum(total_settled) as s_set from fx_settlements group by customer_id
      ), fx_pay as (
        select p.customer_id, sum(case when upper(i.currency_code)='CNY' then i.amount else 0 end) as pay_cny
        from fx_payments p join fx_payment_items i on i.payment_id=p.id
        group by p.customer_id
      )
      select (coalesce(c.opening_cny,0) + coalesce(p.net_cny,0) + coalesce(fs.s_set,0) - coalesce(fp.pay_cny,0)) as balance_cny
      from customers c
      left join tx_pivot p on p.customer_id = c.id
      left join fx_set fs on fs.customer_id = c.id
      left join fx_pay fp on fp.customer_id = c.id
      where c.id = $1
    `, [Number(customer_id)])
    if (rs.rowCount) balanceCny = Number(rs.rows[0].balance_cny || 0)
  } catch {}

  const createdIds = []
  // 若 split=true，则每个账户生成一个单据；否则保留为单个单据（原有逻辑）
  if (!split) {
    const createdAtIso = new Date().toISOString()
    const bill_no = createdAtIso.replaceAll('-', '').replaceAll(':', '').replace('.', '')
    const ins = await query(`insert into fx_payments(bill_no, customer_id, customer_name, pay_date, status, created_by) values($1,$2,$3,$4,'pending',$5) returning id`, [bill_no, Number(customer_id), customer_name || null, pay_date, created_by])
    const pid = ins.rows[0].id
    const values = []
    const params = []
    let idx = 1
    for (const it of items) {
      const amt = Math.max(0, Number(it.amount)||0)
      values.push(`($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++})`)
      params.push(pid, Number(it.account_id), it.account_name || null, it.bank_account || null, (it.currency_code || '').toUpperCase(), amt)
    }
    if (values.length) await query(`insert into fx_payment_items(payment_id, account_id, account_name, bank_account, currency_code, amount) values ${values.join(',')}`, params)
    createdIds.push(pid)
  } else {
    // 多单拆分：按传入顺序逐个账户生成单据；余额不足时自动截断到余额，余额归零后不再生成
    let rest = Number(balanceCny || 0)
    for (const it of items) {
      let amt = Math.max(0, Number(it.amount)||0)
      if (rest <= 0) break
      if (amt <= 0) continue
      if (amt > rest) amt = rest
      // 生成单据头
      const createdAtIso = new Date().toISOString()
      const bill_no = createdAtIso.replaceAll('-', '').replaceAll(':', '').replace('.', '')
      const ins = await query(`insert into fx_payments(bill_no, customer_id, customer_name, pay_date, status, created_by) values($1,$2,$3,$4,'pending',$5) returning id`, [bill_no, Number(customer_id), customer_name || null, pay_date, created_by])
      const pid = ins.rows[0].id
      await query(`insert into fx_payment_items(payment_id, account_id, account_name, bank_account, currency_code, amount) values ($1,$2,$3,$4,$5,$6)`,
        [pid, Number(it.account_id), it.account_name || null, it.bank_account || null, (it.currency_code || '').toUpperCase(), amt])
      createdIds.push(pid)
      rest -= amt
    }
  }
  res.json({ ids: createdIds })
})

fxRouter.get('/payments', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const { customerId, startDate, endDate, page = 1, pageSize = 20, status, view = 'item' } = req.query
  const where = []
  const params = []
  let idx = 1
  if (customerId) { where.push(`p.customer_id = $${idx++}`); params.push(Number(customerId)) }
  if (startDate) { where.push(`p.pay_date >= $${idx++}`); params.push(startDate) }
  if (endDate)   { where.push(`p.pay_date <= $${idx++}`); params.push(endDate) }
  if (status)    { where.push(`p.status = $${idx++}`); params.push(String(status)) }
  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  const offset = (Number(page)-1) * Number(pageSize)
  if (String(view) === 'head') {
    const total = await query(`select count(*) from fx_payments p ${whereSql}`, params)
    const rows = await query(
      `with agg as (
         select payment_id, sum(amount) as total_amount from fx_payment_items group by payment_id
       )
       select 
         p.*, 
         coalesce(u.display_name, u.username) as created_by_name, 
         coalesce(a.total_amount,0) as total_amount,
         (
           coalesce(c.opening_cny,0)
           + coalesce((
               select sum(coalesce(t.credit_amount,0) - coalesce(t.debit_amount,0))
               from transactions t
               left join receiving_accounts ra on ra.bank_account = t.account_number
               where coalesce(t.matched,false) = true 
                 and t.match_type = 'customer'
                 and t.match_target_id = p.customer_id
                 and upper(ra.currency_code) = 'CNY'
                 and t.transaction_date <= p.pay_date
             ), 0)
           + coalesce((
               select sum(s2.total_settled)
               from fx_settlements s2
               where s2.customer_id = p.customer_id
                 and s2.settle_date <= p.pay_date
             ), 0)
           - coalesce((
               select sum(i2.amount)
               from fx_payments p2
               join fx_payment_items i2 on i2.payment_id = p2.id
               where p2.customer_id = p.customer_id
                 and upper(i2.currency_code) = 'CNY'
                 and (p2.pay_date < p.pay_date or (p2.pay_date = p.pay_date and p2.id < p.id))
             ), 0)
         ) as balance_cny
       from fx_payments p
       left join users u on u.id = p.created_by
       left join agg a on a.payment_id = p.id
       left join customers c on c.id = p.customer_id
       ${whereSql}
       order by p.id desc offset $${idx++} limit $${idx++}`,
      [...params, offset, Number(pageSize)]
    )
    return res.json({ total: Number(total.rows[0].count || 0), items: rows.rows })
  }
  // view = item（扁平到明细行）
  const total = await query(
    `select count(*)
     from fx_payments p
     join fx_payment_items i on i.payment_id = p.id
     ${whereSql}`,
    params
  )
  const rows = await query(
    `select 
       p.id as payment_id,
       p.bill_no,
       p.customer_id,
       p.customer_name,
       p.pay_date,
       p.status,
       coalesce(u.display_name, u.username) as created_by_name,
       (
         coalesce(c.opening_cny,0)
         + coalesce((
             select sum(coalesce(t.credit_amount,0) - coalesce(t.debit_amount,0))
             from transactions t
             left join receiving_accounts ra on ra.bank_account = t.account_number
             where coalesce(t.matched,false) = true 
               and t.match_type = 'customer'
               and t.match_target_id = p.customer_id
               and upper(ra.currency_code) = 'CNY'
               and t.transaction_date <= p.pay_date
           ), 0)
         + coalesce((
             select sum(s2.total_settled)
             from fx_settlements s2
             where s2.customer_id = p.customer_id
               and s2.settle_date <= p.pay_date
           ), 0)
         - coalesce((
             select sum(i2.amount)
             from fx_payments p2
             join fx_payment_items i2 on i2.payment_id = p2.id
             where p2.customer_id = p.customer_id
               and upper(i2.currency_code) = 'CNY'
               and (p2.pay_date < p.pay_date or (p2.pay_date = p.pay_date and p2.id < p.id))
           ), 0)
       ) as balance_cny,
       i.id as item_id,
       i.account_name,
       i.bank_account,
       upper(i.currency_code) as currency_code,
       i.amount,
       b.zh as bank_name,
       b.code as bank_code,
       b.logo_url as bank_logo_url
     from fx_payments p
     join fx_payment_items i on i.payment_id = p.id
     left join users u on u.id = p.created_by
     left join customers c on c.id = p.customer_id
     -- 银行信息优先取客户专属账户（CRA，付款区来源），否则回退到通用账户
     left join receiving_accounts ra on ra.bank_account = i.bank_account
     left join customer_receiving_accounts cra on cra.bank_account = i.bank_account and cra.customer_id = p.customer_id
     left join banks b on b.id = coalesce(cra.bank_id, ra.bank_id)
     ${whereSql}
     order by p.id desc, i.id desc offset $${idx++} limit $${idx++}`,
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
  // 联表获取银行信息（名称/代码），用于前端展示银行名称与 Logo
  const items = await query(
    `select 
       i.id,
       i.payment_id,
       i.account_name,
       i.bank_account,
       upper(i.currency_code) as currency_code,
       i.amount,
       coalesce(bcra.zh, bid.zh, bacc.zh) as bank_name,
       coalesce(bcra.code, bid.code, bacc.code) as bank_code
     from fx_payment_items i
     left join fx_payments p on p.id = i.payment_id
     -- 1) 优先客户专属账户（CRA）指定的银行
     left join customer_receiving_accounts cra on cra.bank_account = i.bank_account and cra.customer_id = p.customer_id
     left join banks bcra on bcra.id = cra.bank_id
     -- 2) 其次按 account_id 关联的通用账户
     left join receiving_accounts ra_id on ra_id.id = i.account_id
     left join banks bid on bid.id = ra_id.bank_id
     -- 3) 最后按 bank_account 文本回退
     left join receiving_accounts ra_acc on ra_acc.bank_account = i.bank_account
     left join banks bacc on bacc.id = ra_acc.bank_id
     where i.payment_id = $1
     order by i.id desc`,
    [id]
  )
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

// 付款单：审批通过
fxRouter.post('/payments/:id/approve', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const { platform_id } = req.body || {}
  const pid = Number(platform_id)
  // 手续费采用平台商后台设置
  let feePct = 0
  const uid = req.user?.id || null

  try {
    await query('begin')
    // 锁定单据头，校验状态
    const h = await query(`select * from fx_payments where id=$1 for update`, [id])
    if (!h.rowCount) { await query('rollback'); return res.status(404).json({ error: 'not found' }) }
    const head = h.rows[0]
    if (String(head.status) !== 'pending') { await query('rollback'); return res.status(400).json({ error: 'only pending can be approved' }) }

    // 汇总明细：按币种统计金额
    const items = await query(`select upper(currency_code) as currency, sum(amount) as total from fx_payment_items where payment_id=$1 group by upper(currency_code)`, [id])
    // 没有明细视为错误
    if (!items.rowCount) { await query('rollback'); return res.status(400).json({ error: 'empty items' }) }

    // 如指定平台，则按平台设置的手续费校验并扣减余额
    let feeTotal = 0
    const deltas = {}
    if (pid) {
      // 锁平台行并获取手续费配置
      const pr = await query(`select id, balance_usd, balance_myr, balance_cny, fee_percent from fx_platforms where id=$1 for update`, [pid])
      if (!pr.rowCount) { await query('rollback'); return res.status(404).json({ error: 'platform not found' }) }
      const p = pr.rows[0]
      feePct = Math.max(0, Number(p.fee_percent||0))

      // 逐币种计算应扣余额与手续费
      for (const r of items.rows) {
        const cur = String(r.currency||'').toUpperCase()
        const amt = Math.round(Number(r.total||0) * 100) / 100
        if (!(amt > 0)) continue
        const field = cur === 'USD' ? 'balance_usd' : (cur === 'MYR' ? 'balance_myr' : (cur === 'CNY' ? 'balance_cny' : null))
        if (!field) { await query('rollback'); return res.status(400).json({ error: `unsupported currency ${cur}` }) }
        const fee = Math.round((amt * feePct / 100) * 100) / 100
        feeTotal += fee
        const before = Number(p[field]||0)
        const need = Math.round((amt + fee) * 100) / 100
        if (before < need) { await query('rollback'); return res.status(400).json({ error: 'insufficient platform balance', detail: { currency: cur, required: need, current: before } }) }
        const after = Math.round((before - need) * 100) / 100
        await query(`update fx_platforms set ${field}=$1 where id=$2`, [after, pid])
        p[field] = after
        deltas[cur] = { amount: amt, fee, total: need }
      }
    }

    // 更新单据头：状态、平台与手续费
    const up = await query(`
      update fx_payments
         set status='completed', approved_by=$1, approved_at=now(),
             platform_id=$2, platform_fee_percent=$3, platform_fee_amount=$4
       where id=$5
       returning *
    `, [uid, (pid||null), feePct, Math.round(feeTotal*100)/100, id])
    if (!up.rowCount) { await query('rollback'); return res.status(404).json({ error: 'not found' }) }

    // 写审核日志
    await query(`insert into fx_payment_audits(payment_id, action, platform_id, fee_percent, fee_amount, deltas, acted_by) values($1,$2,$3,$4,$5,$6,$7)`,
      [id, 'approve', (pid||null), feePct, Math.round(feeTotal*100)/100, JSON.stringify(deltas), uid])

    await query('commit')
    return res.json({ ok: true })
  } catch (e) {
    await query('rollback')
    console.error('approve payment failed', e)
    return res.status(500).json({ error: 'approve failed', detail: e.message })
  }
})

// 付款单：批量审批（原子）
fxRouter.post('/payments/batch-approve', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const { ids, platform_id } = req.body || {}
  const list = Array.isArray(ids) ? ids.map(Number).filter(n => n > 0) : []
  const pid = Number(platform_id)
  if (!list.length) return res.status(400).json({ error: 'ids required' })
  if (!pid) return res.status(400).json({ error: 'platform required' })
  const uid = req.user?.id || null

  try {
    await query('begin')
    // 锁平台，获取余额与手续费
    const pr = await query(`select id, balance_usd, balance_myr, balance_cny, fee_percent from fx_platforms where id=$1 for update`, [pid])
    if (!pr.rowCount) { await query('rollback'); return res.status(404).json({ error: 'platform not found' }) }
    const p = pr.rows[0]
    const feePct = Math.max(0, Number(p.fee_percent||0))

    // 准备数据结构
    const perPayment = new Map() // id -> { items: [{currency, amt}], deltas, feeTotal }
    const grandTotals = { USD: 0, MYR: 0, CNY: 0 }

    // 锁并校验每张单据，汇总数据
    for (const id of list) {
      const h = await query(`select * from fx_payments where id=$1 for update`, [id])
      if (!h.rowCount) { await query('rollback'); return res.status(404).json({ error: `payment ${id} not found` }) }
      const head = h.rows[0]
      if (String(head.status) !== 'pending') { await query('rollback'); return res.status(400).json({ error: `payment ${id} not pending` }) }

      const items = await query(`select upper(currency_code) as currency, sum(amount) as total from fx_payment_items where payment_id=$1 group by upper(currency_code)`, [id])
      if (!items.rowCount) { await query('rollback'); return res.status(400).json({ error: `payment ${id} has no items` }) }

      const deltas = {}
      let feeTotal = 0
      for (const r of items.rows) {
        const cur = String(r.currency||'').toUpperCase()
        const amt = Math.round(Number(r.total||0) * 100) / 100
        if (!(amt > 0)) continue
        const fee = Math.round((amt * feePct / 100) * 100) / 100
        const need = Math.round((amt + fee) * 100) / 100
        deltas[cur] = { amount: amt, fee, total: need }
        feeTotal += fee
        if (cur === 'USD' || cur === 'MYR' || cur === 'CNY') grandTotals[cur] = Math.round((grandTotals[cur] + need) * 100) / 100
        else { await query('rollback'); return res.status(400).json({ error: `unsupported currency ${cur}` }) }
      }
      perPayment.set(id, { deltas, feeTotal })
    }

    // 校验平台余额是否充足（按总量）
    const before = { USD: Number(p.balance_usd||0), MYR: Number(p.balance_myr||0), CNY: Number(p.balance_cny||0) }
    for (const cur of ['USD','MYR','CNY']) {
      const need = Number(grandTotals[cur]||0)
      if (need > 0 && before[cur] < need) {
        await query('rollback')
        return res.status(400).json({ error: 'insufficient platform balance', detail: { currency: cur, required: need, current: before[cur] } })
      }
    }

    // 扣减平台余额（一次性）
    const after = {
      USD: Math.round((before.USD - grandTotals.USD) * 100) / 100,
      MYR: Math.round((before.MYR - grandTotals.MYR) * 100) / 100,
      CNY: Math.round((before.CNY - grandTotals.CNY) * 100) / 100
    }
    await query(`update fx_platforms set balance_usd=$1, balance_myr=$2, balance_cny=$3 where id=$4`, [after.USD, after.MYR, after.CNY, pid])

    // 更新每张单据状态并写审计
    for (const id of list) {
      const { deltas, feeTotal } = perPayment.get(id)
      await query(`
        update fx_payments
           set status='completed', approved_by=$1, approved_at=now(),
               platform_id=$2, platform_fee_percent=$3, platform_fee_amount=$4
         where id=$5
      `, [uid, pid, feePct, Math.round(feeTotal*100)/100, id])

      await query(`insert into fx_payment_audits(payment_id, action, platform_id, fee_percent, fee_amount, deltas, acted_by) values($1,$2,$3,$4,$5,$6,$7)`,
        [id, 'approve', pid, feePct, Math.round(feeTotal*100)/100, JSON.stringify(deltas), uid])
    }

    await query('commit')
    return res.json({ ok: true, count: list.length })
  } catch (e) {
    await query('rollback')
    console.error('batch approve failed', e)
    return res.status(500).json({ error: 'batch approve failed', detail: e.message })
  }
})

// 付款单：撤销审批（回滚平台余额扣减，状态回到 pending）
fxRouter.post('/payments/:id/unapprove', authMiddleware(true), requirePerm('manage_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const uid = req.user?.id || null
  try {
    await query('begin')
    const h = await query(`select * from fx_payments where id=$1 for update`, [id])
    if (!h.rowCount) { await query('rollback'); return res.status(404).json({ error: 'not found' }) }
    const head = h.rows[0]
    if (String(head.status) !== 'completed') { await query('rollback'); return res.status(400).json({ error: 'only completed can be unapproved' }) }

    const pid = Number(head.platform_id||0)
    const feePct = Number(head.platform_fee_percent||0)
    const items = await query(`select upper(currency_code) as currency, sum(amount) as total from fx_payment_items where payment_id=$1 group by upper(currency_code)`, [id])
    const deltas = {}
    if (pid) {
      const pr = await query(`select id, balance_usd, balance_myr, balance_cny from fx_platforms where id=$1 for update`, [pid])
      if (!pr.rowCount) { await query('rollback'); return res.status(404).json({ error: 'platform not found' }) }
      const p = pr.rows[0]
      for (const r of items.rows) {
        const cur = String(r.currency||'').toUpperCase()
        const amt = Math.round(Number(r.total||0) * 100) / 100
        if (!(amt > 0)) continue
        const field = cur === 'USD' ? 'balance_usd' : (cur === 'MYR' ? 'balance_myr' : (cur === 'CNY' ? 'balance_cny' : null))
        if (!field) { await query('rollback'); return res.status(400).json({ error: `unsupported currency ${cur}` }) }
        const fee = Math.round((amt * feePct / 100) * 100) / 100
        const back = Math.round((amt + fee) * 100) / 100
        const before = Number(p[field]||0)
        const after = Math.round((before + back) * 100) / 100
        await query(`update fx_platforms set ${field}=$1 where id=$2`, [after, pid])
        p[field] = after
        deltas[cur] = { amount: amt, fee, total: back }
      }
    }

    // 回到 pending（保留 platform_id/fee% 以便再次审批）
    await query(`update fx_payments set status='pending', approved_by=null, approved_at=null where id=$1`, [id])
    await query(`insert into fx_payment_audits(payment_id, action, platform_id, fee_percent, fee_amount, deltas, acted_by) values($1,$2,$3,$4,$5,$6,$7)`,
      [id, 'unapprove', (pid||null), feePct, Number(head.platform_fee_amount||0), JSON.stringify(deltas), uid])

    await query('commit')
    return res.json({ ok: true })
  } catch (e) {
    await query('rollback')
    console.error('unapprove payment failed', e)
    return res.status(500).json({ error: 'unapprove failed', detail: e.message })
  }
})

// 审核日志列表
fxRouter.get('/payments/:id/audits', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const rs = await query(`
    select a.*, coalesce(u.display_name,u.username) as acted_by_name, p.name as platform_name
    from fx_payment_audits a
    left join users u on u.id = a.acted_by
    left join fx_platforms p on p.id = a.platform_id
    where a.payment_id=$1
    order by a.id desc
  `, [id])
  res.json({ items: rs.rows })
})

// 付款单：导出 PDF（凭证）
fxRouter.get('/payments/:id/pdf', authMiddleware(true), requirePerm('view_fx'), async (req, res) => {
  await ensureDDL()
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'invalid id' })
  const head = await query(`
    select p.*, coalesce(u.display_name, u.username) as created_by_name, coalesce(a.display_name, a.username) as approved_by_name
    from fx_payments p
    left join users u on u.id = p.created_by
    left join users a on a.id = p.approved_by
    where p.id=$1
  `, [id])
  if (!head.rows.length) return res.status(404).json({ error: 'not found' })
  const items = await query(`
    select 
      i.*, 
      b.code as bank_code,
      b.zh   as bank_name_zh,
      b.en   as bank_name_en
    from fx_payment_items i
    join fx_payments p2 on p2.id = i.payment_id
    left join receiving_accounts ra on ra.bank_account = i.bank_account
    left join customer_receiving_accounts cra on cra.bank_account = i.bank_account and cra.customer_id = p2.customer_id
    -- 银行信息优先取客户专属账户（CRA），否则回退到通用账户（RA）
    left join banks b on b.id = coalesce(cra.bank_id, ra.bank_id)
    where i.payment_id=$1 order by i.id asc
  `, [id])

  // 语言选择：单语模板，随语言切换
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
      title: 'Payment Receipt',
      amount: 'Amount (CNY)',
      payee: 'Payee',
      account: 'Account No',
      bank: 'Bank',
      status: 'Status',
      billNo: 'Transaction No',
      date: 'Transaction Time',
      completed: 'Completed',
      pending: 'Pending'
    },
    zh: {
      title: '支付确认回单',
      amount: '金额 (CNY)',
      payee: '收款人',
      account: '账号',
      bank: '银行',
      status: '交易状态',
      billNo: '交易号',
      date: '交易时间',
      completed: '支付确认',
      pending: '待确认'
    }
  }
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k

  res.setHeader('Content-Type', 'application/pdf')
  // 文件名：付款日期 + 账户名 + 金额 + 银行代码
  const h0 = head.rows[0]
  const payDate = (() => { try { const v = h0.pay_date; let s=''; if (typeof v === 'string') s = v.slice(0,10); else if (v && v.toISOString) s = v.toISOString().slice(0,10); else s = String(v||'').slice(0,10); return s.replace(/-/g,'') } catch { return '' } })()
  const acctName0 = (items.rows[0]?.account_name) || h0.customer_name || 'Account'
  const totalAmt0 = items.rows.reduce((s,r)=> s + Number(r.amount||0), 0)
  const amountStr = String(Math.round(Number(totalAmt0||0)))
  const bankCode0 = (String(items.rows[0]?.bank_code || '').toUpperCase()) || 'OTHER'
  const sanitize = (s) => String(s).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim()
  const baseName = `${payDate}+${sanitize(acctName0)}+${amountStr}+${bankCode0}`
  const asciiName = `${baseName}.pdf`.replace(/[^\x20-\x7E]/g, '_')
  const utf8Name = encodeURIComponent(`${baseName}.pdf`)
  res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`)

  const ACCENT = '#2F4858' // 深色强调
  const LIGHT_ACCENT = '#e4edf1'
  const BRAND = process.env.BRAND_NAME || (lang==='zh' ? '公司收付系统' : 'Payment System')
  const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margins: { top: 20, bottom: 56, left: 28, right: 28 } })
  doc.pipe(res)
  // 页脚 logo 资源路径
  let footerLogoPath = null
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const cand = path.join(__dirname, '..', '..', 'public', 'pdf-assets', 'footer-logo.png')
    if (fs.existsSync(cand)) footerLogoPath = cand
  } catch {}
  // 生成二维码 ASCII 查询串（更整洁，避免中文乱码）
  const h = head.rows[0]
  const totalAmt = items.rows.reduce((s,r)=> s + Number(r.amount||0), 0)
  const bankCodeFromRow = (String(items.rows[0]?.bank_code || '').toUpperCase()) || 'OTHER'
  const acct = (items.rows[0]?.bank_account || '')
  const acct4 = acct ? String(acct).replace(/\D/g,'').slice(-4) : ''
  const bankCode = bankCodeFromRow
  const v = 1
  const idStr = String(h.id)
  const no = encodeURIComponent(h.bill_no || ('Payment-'+h.id))
  const amt = (Number(totalAmt||0)).toFixed(2)
  const cur = 'CNY'
  const st = (h.status==='completed' ? 'C' : 'P')
  const tsNum = Date.now()
  const baseQuery = `v=${v}&id=${idStr}&no=${no}&amt=${amt}&cur=${cur}&st=${st}&bk=${bankCode}&acct4=${acct4}&ts=${tsNum}`
  const hash = crypto.createHash('sha256').update(baseQuery).digest('hex').slice(0,24)
  const qrText = `${baseQuery}&sig=${hash}`
  let qrDataUrl = null
  try { qrDataUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel:'M', margin:0, scale:4 }) } catch {}

  const drawFooter = () => {
    const pageWidth = doc.page.width
    const leftX = doc.page.margins.left
    const rightX = pageWidth - doc.page.margins.right
    const footerTop = doc.page.height - 78
    // 分隔线
    doc.save()
    doc.moveTo(leftX, footerTop).lineTo(rightX, footerTop).strokeColor('#d8e2e8').lineWidth(1).stroke()
    doc.restore()
    // Logo 放大 1 倍并在分隔线与页面底边之间垂直居中
    if (footerLogoPath) {
      const contentWidthFooter = rightX - leftX
      const baseW = 210
      const imgW = Math.min(contentWidthFooter, baseW * 2) // 放大一倍且不超过内容宽
      const spaceHeight = doc.page.height - footerTop
      // 估算图片高度（假设横向长图，高宽比 ~5:1，便于垂直居中）
      const estImgH = imgW / 5
  // 需求: 再下移 1.5 个字符高度；按 12pt 基准字体估算 ≈ 18pt
  // 再次微调: 追加下移 0.5 个字符 ≈ 6pt
  const y = footerTop + (spaceHeight - estImgH) / 2 + 24
      const x = (pageWidth - imgW) / 2
      try { doc.image(footerLogoPath, x, y, { width: imgW }) } catch {}
    }
    // 右下角二维码 (位置保持靠近底部右侧)
    if (qrDataUrl) {
      const qrSize = 64
      const qrX = pageWidth - doc.page.margins.right - qrSize
      const qrY = doc.page.height - qrSize - 8
      try {
        const base64 = qrDataUrl.split(',')[1]
        const buf = Buffer.from(base64, 'base64')
  doc.image(buf, qrX, qrY, { width: qrSize, height: qrSize })
  doc.fontSize(6).fillColor('#555555').text('验证二维码 / Verify QR', qrX, qrY - 8, { width: qrSize, align:'center' })
      } catch {}
    }
  }
  // 首页与后续页面都绘制页脚
  doc.on('pageAdded', drawFooter)
  let hasCJK = false, hasCJKBold = false
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const reg = [
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Regular.ttf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Regular.otf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansCJKsc-Regular.otf')
    ]
    const bold = [
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Bold.ttf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansSC-Bold.otf'),
      path.join(__dirname, '..', '..', 'public', 'fonts', 'NotoSansCJKsc-Bold.otf')
    ]
    const fr = reg.find(p => fs.existsSync(p))
    const fb = bold.find(p => fs.existsSync(p))
    if (fr) { doc.registerFont('CJK', fr); hasCJK = true }
    if (fb) { doc.registerFont('CJK-Bold', fb); hasCJKBold = true }
  } catch {}
  const font = hasCJK ? 'CJK' : 'Helvetica'
  const fontBold = hasCJKBold ? 'CJK-Bold' : (hasCJK ? 'CJK' : 'Helvetica-Bold')
  const toDate = (v) => { try { if (typeof v === 'string') return v.slice(0,10); if (v.toISOString) return v.toISOString().slice(0,10); return String(v).slice(0,10) } catch { return String(v).slice(0,10) } }
  const money = (n) => Number(n||0).toLocaleString(undefined,{ minimumFractionDigits:2, maximumFractionDigits:2 })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const contentWidth = right - left

  // ===== 头部标题（两行：付款凭证 / Payment Receipt） =====
  const headerBlockY = doc.y
  const centerX = left + contentWidth/2
  doc.save()
  doc.fillColor(ACCENT)
  // 上：付款凭证（大）
  doc.font(fontBold).fontSize(20)
  doc.text('付款凭证', left, headerBlockY, { width: contentWidth, align: 'center' })
  // 下：Payment Receipt（英）
  doc.font(font).fontSize(12).fillColor('#30424f')
  doc.text('Payment Receipt', left, doc.y - 2, { width: contentWidth, align: 'center' })
  // 下划线强调
  const underlineY = doc.y + 2
  doc.moveTo(left + contentWidth*0.3, underlineY).lineTo(left + contentWidth*0.7, underlineY).lineWidth(1).strokeColor('#9fb3bf').stroke()
  doc.restore()
  doc.moveDown(0.6)


  // ===== 金额分节条 + 金额下方左对齐展示 =====
  const padX = left + 12
  const total = items.rows.reduce((s, r) => s + Number(r.amount||0), 0)
  // 分节彩条
  ;(function amountSection(){
    const y = doc.y
    const hBar = 20
    doc.save()
    doc.roundedRect(left, y, contentWidth, hBar, 4).fill('#e4edf1')
    doc.fillColor(ACCENT).font(fontBold).fontSize(11).text('支付金额 / Payment Amount', padX, y + 4)
    doc.restore()
    doc.y = y + hBar + 4
  })()
  // 位于彩条下方显示金额
  const currencyLabel = 'CNY: ' + money(total)
  doc.font(fontBold).fontSize(18).fillColor(ACCENT).text(currencyLabel, padX, doc.y)
  doc.moveDown(0.6)

  // 工具：分节彩条 + 双语标题
  const sectionBar = (zh, en) => {
    const y = doc.y
    const hBar = 20
    doc.save()
    doc.roundedRect(left, y, contentWidth, hBar, 4).fill('#e4edf1')
    doc.fillColor(ACCENT).font(fontBold).fontSize(11).text(`${zh} / ${en}`, padX, y + 4)
    doc.restore()
    doc.y = y + hBar + 4
  }
  // 工具：双语标签-值
  const drawLabelValue = (zh, en, value) => {
    const label = `${zh} / ${en}: `
    const y = doc.y
    doc.font(fontBold).fontSize(10).fillColor('#5a5f63').text(label, padX, y, { continued: true })
    doc.font(font).fontSize(12).fillColor('#111').text(value==null?'':String(value))
    doc.moveDown(0.2)
  }

  // ===== 收款人信息 / Payee Info =====
  sectionBar('收款人信息', 'Payee Info')
  drawLabelValue('收款人', 'Payee', items.rows[0]?.account_name||'')
  drawLabelValue('账户号码', 'Account No', items.rows[0]?.bank_account||'')
  // 银行名称：直接使用数据库字段（中文/英文），不再做手动映射
  {
    const cn = items.rows[0]?.bank_name_zh || ''
    const en = items.rows[0]?.bank_name_en || ''
    const display = [cn, en].filter(Boolean).join(' / ')
    drawLabelValue('银行名称', 'Bank', display)
  }

  // ===== 交易详情 / Transaction Details =====
  sectionBar('交易详情', 'Transaction Details')
  drawLabelValue('交易号', 'Transaction No', (h.bill_no || ('Payment-'+h.id)))
  drawLabelValue('交易状态', 'Status', h.status==='completed' ? '支付确认 / Completed' : '待确认 / Pending')
  drawLabelValue('交易时间', 'Transaction Time', toDate(h.pay_date))

  // 多笔合并说明（若有）
  if (items.rows.length > 1) {
    doc.font(fontBold).fontSize(8).fillColor(ACCENT).text(`合并明细 / Merged Items: 共 ${items.rows.length} 条 / ${items.rows.length} items`)
    doc.font(font).fontSize(7).fillColor('#555555').text('仅展示首条，其余计入总金额。/ Only first item shown; others included in total.')
    doc.moveDown(0.4)
  }

  drawFooter()
  doc.end()
})

//（已合并回 /payments/:id/pdf）

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
