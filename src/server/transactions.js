// 交易管理相关API
import express from 'express';
import { parse as parseCsv } from 'csv-parse/sync';
import { query } from './db.js';
import { authMiddleware, requirePerm } from './auth.js';
import { parseCSV } from './utils.js';
import { getMockTransactions, getMockTransactionStats } from './mockTransactions.js';

export const transactionsRouter = express.Router();

// Ensure transactions table exists
async function ensureTransactionsDDL() {
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
    -- 扩展匹配相关字段（幂等）
    alter table transactions
      add column if not exists matched boolean default false,
      add column if not exists match_type varchar(32),
      add column if not exists match_target_id int,
      add column if not exists match_target_name varchar(255),
      add column if not exists matched_by int,
      add column if not exists matched_at timestamptz;
  `)
}

// Helpers for import
function cleanCell(v) {
  if (v === null || v === undefined) return ''
  let s = String(v).trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1)
  const m = /^=\"(.*)\"$/.exec(s)
  if (m) s = m[1]
  return s.trim()
}
function parseAmount(v) {
  const s = cleanCell(v).replace(/,/g, '').replace(/\s+/g, '')
  if (!s) return 0
  const n = Number(s)
  return isNaN(n) ? 0 : n
}
function parseDateYYYYMMDD(v) {
  // already YYYY-MM-DD -> passthrough
  const s = cleanCell(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // dd/mm/yyyy -> convert
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (m) {
    const [_, d, mo, y] = m
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  return s
}

// 清洗参考字段：去除连续空白，移除 3 个及以上的 X/x 片段，并整体 trim
function sanitizeReferenceText(s) {
  if (!s) return null
  let t = String(s)
  // 移除大小写不敏感的 X{3,}
  t = t.replace(/x{3,}/gi, '')
  // 合并连续空白为单空格
  t = t.replace(/\s+/g, ' ')
  // 去除前后空白
  t = t.trim()
  // 限制长度，避免超出 varchar(128)
  if (t.length > 128) t = t.slice(0, 128)
  return t || null
}

// 下载导入模板（返回JSON样例，前端将转CSV）
transactionsRouter.get('/template', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  return res.json([
    {
      accountNumber: '000123456789',
      transactionDate: '2025-10-01',
      chequeRefNo: 'CHK20251001',
      transactionDescription: 'Salary payment',
      debitAmount: 0,
      creditAmount: 8500,
      reference: 'REF123456'
    }
  ])
})

// 获取交易列表，支持分页、排序和筛选
transactionsRouter.get('/', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    // 自愈：缺表时自动创建
    await ensureTransactionsDDL()
    const { 
      page = 1, 
      pageSize = 20, 
      sort = 'transaction_date', 
      order = 'desc',
      startDate,
      endDate,
      account,
      category,
      minAmount,
      maxAmount,
      searchTerm,
      searchAmountOnly,
      status
    } = req.query;

    const offset = (Number(page) - 1) * Number(pageSize);

    // 构建过滤条件（可复用，支持不同占位符起始索引）
    function buildWhere(baseIndex = 1) {
      const filters = [];
      const vals = [];
      if (status) {
        const s = String(status).toLowerCase()
        if (s === 'pending') filters.push(`coalesce(matched,false) = false`)
        else if (s === 'matched') filters.push(`coalesce(matched,false) = true`)
      }
      const add = (builder, val) => { const idx = baseIndex + vals.length; filters.push(builder(idx)); vals.push(val); };
      if (startDate) add(i => `transaction_date >= $${i}`, startDate);
      if (endDate) add(i => `transaction_date <= $${i}`, endDate);
      if (account) add(i => `account_number ILIKE $${i}`, `%${account}%`);
      // 类别已取消
      if (minAmount) add(i => `(debit_amount >= $${i} OR credit_amount >= $${i})`, Number(minAmount));
      if (maxAmount) add(i => `(debit_amount <= $${i} OR credit_amount <= $${i})`, Number(maxAmount));
      if (searchTerm) {
        const amountOnly = String(searchAmountOnly || '').toLowerCase() in { '1':1, 'true':1 };
        const numeric = Number(String(searchTerm).replace(/[,\s]/g, ''))
        if (amountOnly && !Number.isNaN(numeric) && String(searchTerm).trim() !== '') {
          // 精确金额匹配（借方或贷方任一等于该值）
          add(i => `(debit_amount = $${i} OR credit_amount = $${i})`, numeric)
        } else {
          // 全局模糊
          add(i => `(
            account_number ILIKE $${i} OR
            cheque_ref_no ILIKE $${i} OR
            reference_1 ILIKE $${i} OR
            reference_2 ILIKE $${i} OR
            reference_3 ILIKE $${i}
          )`, `%${searchTerm}%`)
        }
      }
      const whereClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';
      return { whereClause, params: vals };
    }

    // 生成 count 查询条件（从 $1 开始）
    const { whereClause: whereForCount, params: paramsForCount } = buildWhere(1);
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM transactions
      ${whereForCount}
    `, paramsForCount);
    const total = parseInt(countResult.rows[0].total || '0', 10);

    // 生成数据查询条件（$1,$2 预留给 LIMIT/OFFSET，从 $3 开始）
    const { whereClause: whereForData, params: paramsForData } = buildWhere(3);
    const allowedSort = new Set(['transaction_date','account_number','cheque_ref_no','debit_amount','credit_amount','created_at','updated_at','id']);
    const sortField = allowedSort.has(String(sort)) ? String(sort) : 'transaction_date';
    const sortOrder = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const result = await query(`
      SELECT 
        t.id, 
        t.account_number,
        to_char(t.transaction_date, 'YYYY-MM-DD') AS "trn_date",
        t.cheque_ref_no,
        t.description AS "transaction_description",
        t.debit_amount,
        t.credit_amount,
        trim(
          regexp_replace(
            regexp_replace(
              coalesce(t.reference_1,'') || ' ' || coalesce(t.reference_2,'') || ' ' || coalesce(t.reference_3,''),
              '\\s+', ' ', 'g'
            ),
            '(?i)x{3,}', '', 'g'
          )
        ) AS "reference",
        u.username AS "createdBy",
        to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
        to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS "updatedAt",
        t.matched,
        t.match_type AS "match_type",
        t.match_target_id AS "match_target_id",
        t.match_target_name AS "match_target_name",
        mb.username AS "matchedBy",
        to_char(t.matched_at, 'YYYY-MM-DD HH24:MI:SS') AS "matchedAt",
        a.account_name,
        b.code AS "bank_code",
        b.zh AS "bank_name",
        b.en AS "bank_name_en",
        b.logo_url AS "bank_logo"
      FROM 
        transactions t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users mb ON t.matched_by = mb.id
      LEFT JOIN receiving_accounts a ON t.account_number = a.bank_account
      LEFT JOIN banks b ON a.bank_id = b.id
      ${whereForData}
      ORDER BY 
        ${sortField} ${sortOrder}
      LIMIT $1 OFFSET $2
    `, [Number(pageSize), offset, ...paramsForData]);
    
    res.json({
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        pages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('获取交易数据失败:', error);
    res.status(500).json({ error: '获取交易数据失败', detail: error.message });
  }
});

// 批量删除交易
transactionsRouter.post('/batch-delete', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '无效的请求参数' });
    }
    
    const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(',');
    
    const result = await query(`
      DELETE FROM transactions
      WHERE id IN (${placeholders})
      RETURNING id
    `, ids);
    
    res.json({ 
      success: true, 
      message: '批量删除成功', 
      deletedCount: result.rowCount 
    });
  } catch (error) {
    console.error('批量删除交易失败:', error);
    res.status(500).json({ error: '批量删除交易失败', detail: error.message });
  }
});

// 获取交易统计信息
transactionsRouter.get('/stats', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { startDate, endDate, account } = req.query;
    let params = [];
    let paramIndex = 1;
    
    // 构建查询条件
    let whereClause = '';
    const whereConditions = [];
    
    if (startDate) {
      whereConditions.push(`transaction_date >= $${paramIndex++}`);
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push(`transaction_date <= $${paramIndex++}`);
      params.push(endDate);
    }
    
    if (account) {
      whereConditions.push(`account_number ILIKE $${paramIndex++}`);
      params.push(`%${account}%`);
    }
    
    if (whereConditions.length > 0) {
      whereClause = 'WHERE ' + whereConditions.join(' AND ');
    }
    
    // 获取统计数据
    const result = await query(`
      SELECT
        COUNT(*) AS "totalTransactions",
        SUM(debit_amount) AS "totalDebit",
        SUM(credit_amount) AS "totalCredit",
        (SUM(credit_amount) - SUM(debit_amount)) AS "netBalance",
        MIN(transaction_date) AS "earliestDate",
        MAX(transaction_date) AS "latestDate",
        COUNT(DISTINCT account_number) AS "accountCount",
        COUNT(DISTINCT category) AS "categoryCount"
      FROM 
        transactions
      ${whereClause}
    `, params);
    
    // 获取按月统计
    const monthlyStats = await query(`
      SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') AS month,
        SUM(debit_amount) AS debit,
        SUM(credit_amount) AS credit
      FROM 
        transactions
      ${whereClause}
      GROUP BY 
        TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY
        month ASC
    `, params);
    
    // 获取按类别统计
    const categoryStats = await query(`
      SELECT
        COALESCE(category, '未分类') AS category,
        COUNT(*) AS count,
        SUM(debit_amount) AS debit,
        SUM(credit_amount) AS credit
      FROM 
        transactions
      ${whereClause}
      GROUP BY 
        category
      ORDER BY
        count DESC
    `, params);
    
    res.json({
      summary: result.rows[0],
      monthly: monthlyStats.rows,
      categories: categoryStats.rows
    });
  } catch (error) {
    console.error('获取交易统计失败:', error);
    res.status(500).json({ error: '获取交易统计失败', detail: error.message });
  }
});

// 导出交易（根据相同筛选条件返回不分页的结果，用于前端导出 CSV）
transactionsRouter.get('/export', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { 
      startDate,
      endDate,
      account,
      category,
      minAmount,
      maxAmount,
      searchTerm,
      searchAmountOnly,
      status
    } = req.query;

    let params = [];
    let paramIndex = 1;
    let whereConditions = [];

    if (startDate) { whereConditions.push(`transaction_date >= $${paramIndex++}`); params.push(startDate); }
    if (endDate) { whereConditions.push(`transaction_date <= $${paramIndex++}`); params.push(endDate); }
    if (account) { whereConditions.push(`account_number ILIKE $${paramIndex++}`); params.push(`%${account}%`); }
    if (category) { whereConditions.push(`category = $${paramIndex++}`); params.push(category); }
    if (minAmount) { whereConditions.push(`(debit_amount >= $${paramIndex} OR credit_amount >= $${paramIndex})`); params.push(Number(minAmount)); paramIndex++; }
    if (maxAmount) { whereConditions.push(`(debit_amount <= $${paramIndex} OR credit_amount <= $${paramIndex})`); params.push(Number(maxAmount)); paramIndex++; }
    if (status) {
      const s = String(status).toLowerCase()
      if (s === 'pending') { whereConditions.push(`coalesce(matched,false) = false`) }
      else if (s === 'matched') { whereConditions.push(`coalesce(matched,false) = true`) }
    }

    if (searchTerm) {
      const amountOnly = String(searchAmountOnly || '').toLowerCase() in { '1':1, 'true':1 };
      const numeric = Number(String(searchTerm).replace(/[,\s]/g, ''))
      if (amountOnly && !Number.isNaN(numeric) && String(searchTerm).trim() !== '') {
        whereConditions.push(`(debit_amount = $${paramIndex} OR credit_amount = $${paramIndex})`)
        params.push(numeric)
        paramIndex++
      } else {
        whereConditions.push(`(
          account_number ILIKE $${paramIndex} OR
          cheque_ref_no ILIKE $${paramIndex} OR
          reference_1 ILIKE $${paramIndex} OR
          reference_2 ILIKE $${paramIndex} OR
          reference_3 ILIKE $${paramIndex}
        )`)
        params.push(`%${searchTerm}%`)
        paramIndex++
      }
    }
    const sqlWhere = whereConditions.length ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const rs = await query(`
      SELECT 
        t.id, 
        t.account_number,
        to_char(t.transaction_date, 'YYYY-MM-DD') AS "transaction_date",
        t.cheque_ref_no,
        t.description,
        t.debit_amount,
        t.credit_amount,
          trim(regexp_replace(regexp_replace(coalesce(t.reference_1,'') || ' ' || coalesce(t.reference_2,'') || ' ' || coalesce(t.reference_3,''),'\\s+',' ','g'),'(?i)x{3,}','','g')) as reference,
        t.matched,
        t.match_type,
        t.match_target_id,
        t.match_target_name,
        to_char(t.matched_at, 'YYYY-MM-DD HH24:MI:SS') AS matched_at,
        a.account_name,
        b.code AS "bank_code",
        b.zh AS "bank_name",
        b.en AS "bank_name_en"
      FROM transactions t
      LEFT JOIN receiving_accounts a ON t.account_number = a.bank_account
      LEFT JOIN banks b ON a.bank_id = b.id
      ${sqlWhere}
      ORDER BY t.transaction_date DESC, t.id DESC
    `, params);

    res.json(rs.rows);
  } catch (e) {
    console.error('导出交易失败:', e);
    res.status(500).json({ error: '导出交易失败', detail: e?.message });
  }
});

// 交易匹配：将一条交易与客户/供应商/费用对象建立关联并标记为 matched
transactionsRouter.post('/:id/match', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const id = Number(req.params.id)
    const { type, targetId, targetName } = req.body || {}
    if (!id || !type) return res.status(400).json({ error: 'missing fields' })
    const t = String(type).toLowerCase()
    if (!['customer','supplier','expense'].includes(t)) return res.status(400).json({ error: 'invalid type' })
    const matched_by = req.user?.id || null
    const name = (targetName || '').toString().trim() || null
    const tid = targetId ? Number(targetId) : null
    const rs = await query(
      `update transactions set matched=true, match_type=$1, match_target_id=$2, match_target_name=$3, matched_by=$4, matched_at=now() where id=$5 returning id`,
      [t, tid, name, matched_by, id]
    )
    if (rs.rowCount === 0) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true })
  } catch (e) {
    console.error('match failed', e)
    res.status(500).json({ error: 'match failed', detail: e.message })
  }
})

// 取消交易关联：清空匹配信息并将 matched=false，使其回到未匹配状态（表1）
transactionsRouter.post('/:id/unmatch', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const id = Number(req.params.id)
    if (!id) return res.status(400).json({ error: 'missing id' })
    const rs = await query(
      `update transactions set matched=false, match_type=null, match_target_id=null, match_target_name=null, matched_by=null, matched_at=null, updated_at=now() where id=$1 returning id`,
      [id]
    )
    if (rs.rowCount === 0) return res.status(404).json({ error: 'not found' })
    res.json({ ok: true })
  } catch (e) {
    console.error('unmatch failed', e)
    res.status(500).json({ error: 'unmatch failed', detail: e.message })
  }
})

// 下载导入模板（返回JSON样例，前端将转CSV）
// 模板由前端自行定义/或另见导出模板接口

// 导入交易（接收JSON rows；前端已将CSV解析为指定字段）
transactionsRouter.post('/import', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    // Ensure transactions table exists (self-healing)
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
    `)
    const { rows } = req.body || {}
    if (!Array.isArray(rows) || !rows.length) return res.json({ inserted: 0, failed: 0, skipped: 0 })

    let inserted = 0, failed = 0, skipped = 0
    for (const r of rows) {
      try {
        const account = cleanCell(r.accountNumber || r.account_number)
        const trn = parseDateYYYYMMDD(r.transactionDate || r.transaction_date)
        if (!account || !trn) { failed++; continue }
        const cheque = cleanCell(r.chequeRefNo || r.cheque_ref_no) || null
        const desc = cleanCell(r.description) || null
        const debit = parseAmount(r.debitAmount || r.debit_amount)
        const credit = parseAmount(r.creditAmount || r.credit_amount)
        const balance = Number(credit || 0) - Number(debit || 0)
        const category = r.category ? cleanCell(r.category) : null
        const r1 = cleanCell(r.reference1 || r.reference_1) || ''
        const r2 = cleanCell(r.reference2 || r.reference_2) || ''
        const r3 = cleanCell(r.reference3 || r.reference_3) || ''
          const mergedRef = sanitizeReferenceText([r1, r2, r3].map(s=>s.trim()).filter(Boolean).join(' '))

        const ins = await query(
          `insert into transactions(
            account_number, transaction_date, cheque_ref_no, description,
            debit_amount, credit_amount, balance, category, reference_1, reference_2, reference_3, created_by
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          on conflict (account_number, transaction_date, cheque_ref_no, debit_amount, credit_amount) do nothing`,
          [account, trn, cheque, desc, Number(debit||0), Number(credit||0), balance, category, mergedRef, null, null, req.user?.id || null]
        )
        if (ins.rowCount && ins.rowCount > 0) inserted++; else skipped++
      } catch (e) {
        failed++
      }
    }
    return res.json({ inserted, skipped, failed })
  } catch (error) {
    console.error('导入交易失败:', error)
    return res.status(500).json({ error: '导入交易失败', detail: error?.message })
  }
})

// 以固定CSV文本导入交易（示例文件格式）
// 要求：请求 Content-Type 为 text/plain 或 */*，body 为CSV纯文本
transactionsRouter.post('/import-csv', express.text({ type: '*/*', limit: '10mb' }), authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const text = (req.body || '').toString()
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'empty body' })

    // 1) 先尝试从文件头提取默认账号（Account Number:,XXXXXXXX）
    const mAcc = /(^|\n)\s*Account\s+Number\s*:\s*,\s*([^\r\n,]+)/i.exec(text)
    const defaultAccount = mAcc ? cleanCell(mAcc[2]) : ''

    // 2) 截取数据表头及其后的数据区块（以 Trn. Date 开头的一行作为表头）
    const lines = text.replace(/\r\n/g, '\n').split('\n')
    const headerIdx = lines.findIndex(l => /^\s*Trn\.\s*Date\s*,/i.test(l))
    if (headerIdx < 0) return res.status(400).json({ error: '未找到数据表头 Trn. Date' })
    const dataBlock = lines.slice(headerIdx).join('\n')

    // 3) 使用 csv-parse 解析为对象数组
    let records = []
    try {
      records = parseCsv(dataBlock, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true
      })
    } catch (e) {
      return res.status(400).json({ error: 'CSV 解析失败', detail: e?.message })
    }

    if (!Array.isArray(records) || !records.length) return res.json({ inserted: 0, skipped: 0, failed: 0 })

    // 识别行内“Account Number”列（容错：去空白/标点/大小写）
    const keys = Object.keys(records[0] || {})
    const normalize = (s) => String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // 去掉非字母数字
    const keyMap = new Map(keys.map(k => [normalize(k), k]))
    const accCol = keyMap.get('accountnumber') || keyMap.get('accountno') || null

    let inserted = 0, skipped = 0, failed = 0
    for (const r of records) {
      try {
        // 优先使用行内账号，其次使用文件头默认账号
        const rowAcc = accCol ? cleanCell(r[accCol]) : ''
        const account = rowAcc || defaultAccount
        if (!account) { failed++; continue }
        const trn = parseDateYYYYMMDD(r['Trn. Date'])
        const cheque = cleanCell(r['Cheque No/Ref No']) || null
        const desc = cleanCell(r['Transaction Description']) || null
        const debit = parseAmount(r['Debit Amount'])
        const credit = parseAmount(r['Credit Amount'])
        const balance = Number(credit || 0) - Number(debit || 0)
        const r1 = cleanCell(r['Reference 1']) || ''
        const r2 = cleanCell(r['Reference 2']) || ''
  const r3 = cleanCell(r['Reference 3']) || ''
  const mergedRef = sanitizeReferenceText([r1, r2, r3].map(s=>s.trim()).filter(Boolean).join(' '))
        if (!trn) { failed++; continue }

        const ins = await query(
          `insert into transactions(
            account_number, transaction_date, cheque_ref_no, description,
            debit_amount, credit_amount, balance, reference_1, reference_2, reference_3, created_by
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          on conflict (account_number, transaction_date, cheque_ref_no, debit_amount, credit_amount) do nothing`,
          [account, trn, cheque, desc, Number(debit||0), Number(credit||0), balance, mergedRef, null, null, req.user?.id || null]
        )
        if (ins.rowCount && ins.rowCount > 0) inserted++; else skipped++
      } catch (e) {
        failed++
      }
    }

    return res.json({ inserted, skipped, failed })
  } catch (e) {
    console.error('import-csv failed', e)
    return res.status(500).json({ error: '导入交易失败', detail: e?.message })
  }
})

// 新增交易
transactionsRouter.post('/', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const {
      account_number,
      transaction_date,
      cheque_ref_no,
      description,
      debit_amount = 0,
      credit_amount = 0,
      reference
    } = req.body || {};

    if (!account_number || !transaction_date) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    const balance = Number(credit_amount || 0) - Number(debit_amount || 0);
  const ref1 = sanitizeReferenceText(reference) || null;
    const ref2 = null;
    const ref3 = null;
    const createdBy = req.user?.id || null;

    const rs = await query(
      `insert into transactions(
        account_number, transaction_date, cheque_ref_no, description,
        debit_amount, credit_amount, balance, reference_1, reference_2, reference_3, created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
      [account_number, transaction_date, cheque_ref_no || null, description || null,
       Number(debit_amount)||0, Number(credit_amount)||0, balance, ref1, ref2, ref3, createdBy]
    );
    res.json({ id: rs.rows[0].id });
  } catch (e) {
    console.error('新增交易失败:', e);
    res.status(500).json({ error: '新增交易失败', detail: e?.message });
  }
});

// 更新交易
transactionsRouter.put('/:id', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const id = Number(req.params.id);
    const {
      account_number,
      transaction_date,
      cheque_ref_no,
      description,
      debit_amount,
      credit_amount,
      reference
    } = req.body || {};

    const fields = [];
    const values = [];
    let idx = 1;
    if (account_number !== undefined) { fields.push(`account_number=$${idx++}`); values.push(account_number); }
    if (transaction_date !== undefined) { fields.push(`transaction_date=$${idx++}`); values.push(transaction_date); }
    if (cheque_ref_no !== undefined) { fields.push(`cheque_ref_no=$${idx++}`); values.push(cheque_ref_no || null); }
    if (description !== undefined) { fields.push(`description=$${idx++}`); values.push(description || null); }
    if (debit_amount !== undefined) { fields.push(`debit_amount=$${idx++}`); values.push(Number(debit_amount)||0); }
    if (credit_amount !== undefined) { fields.push(`credit_amount=$${idx++}`); values.push(Number(credit_amount)||0); }
  if (reference !== undefined) { fields.push(`reference_1=$${idx++}`); values.push(sanitizeReferenceText(reference) || null); }
    if (!fields.length) return res.status(400).json({ error: '无修改内容' });
    // 自动更新 balance
    const setClause = fields.join(', ') + ', balance = coalesce(credit_amount,0) - coalesce(debit_amount,0), updated_at = now()';
    values.push(id);
    const rs = await query(`update transactions set ${setClause} where id=$${idx} returning id`, values);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id });
  } catch (e) {
    console.error('更新交易失败:', e);
    res.status(500).json({ error: '更新交易失败', detail: e?.message });
  }
});

// 批量导入交易
// 旧的重复导入端点已移除，避免行为冲突

// 获取单个交易详情（供查看弹窗使用）
transactionsRouter.get('/:id', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const id = Number(req.params.id);
    const rs = await query(`
      SELECT 
        t.id, 
        t.account_number AS "accountNumber",
        to_char(t.transaction_date, 'YYYY-MM-DD') AS "transactionDate",
        t.cheque_ref_no AS "chequeRefNo",
        t.description,
        t.debit_amount AS "debitAmount",
        t.credit_amount AS "creditAmount",
        t.balance,
        t.category,
        trim(regexp_replace(regexp_replace(coalesce(t.reference_1,'') || ' ' || coalesce(t.reference_2,'') || ' ' || coalesce(t.reference_3,''),'\\s+',' ','g'),'(?i)x{3,}','','g')) AS "reference",
        to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
        to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS "updatedAt"
      FROM transactions t
      WHERE t.id=$1
    `, [id]);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rs.rows[0]);
  } catch (e) {
    console.error('获取交易详情失败:', e);
    res.status(500).json({ error: '获取交易详情失败', detail: e?.message });
  }
});

// 删除单个交易（用于行操作删除）
transactionsRouter.delete('/:id', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const id = Number(req.params.id);
    const rs = await query('delete from transactions where id=$1 returning id', [id]);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('删除交易失败:', e);
    res.status(500).json({ error: '删除交易失败', detail: e?.message });
  }
});