// 交易管理相关API
import express from 'express';
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
      searchTerm
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(pageSize);
    let params = [Number(pageSize), offset];
    let paramIndex = 3;
    
    // 构建基础查询
    let sqlWhere = '';
    const whereConditions = [];
    
    // 添加过滤条件
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
    
    // 移除了类别筛选
    
    if (minAmount) {
      whereConditions.push(`(debit_amount >= $${paramIndex} OR credit_amount >= $${paramIndex})`);
      params.push(Number(minAmount));
      paramIndex++;
    }
    
    if (maxAmount) {
      whereConditions.push(`(debit_amount <= $${paramIndex} OR credit_amount <= $${paramIndex})`);
      params.push(Number(maxAmount));
      paramIndex++;
    }
    
    if (searchTerm) {
      whereConditions.push(`(
        account_number ILIKE $${paramIndex} OR
        cheque_ref_no ILIKE $${paramIndex} OR
        reference_1 ILIKE $${paramIndex} OR
        reference_2 ILIKE $${paramIndex} OR
        reference_3 ILIKE $${paramIndex}
      )`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }
    
    if (whereConditions.length > 0) {
      sqlWhere = 'WHERE ' + whereConditions.join(' AND ');
    }
    
    // 获取总记录数
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM transactions
      ${sqlWhere}
    `, params.slice(2));
    
    const total = parseInt(countResult.rows[0].total);
    
    // 获取分页数据
    const result = await query(`
      SELECT 
        t.id, 
        t.account_number,
        to_char(t.transaction_date, 'YYYY-MM-DD') AS "trn_date",
        t.cheque_ref_no,
        t.description AS "transaction_description",
        t.debit_amount,
        t.credit_amount,
        t.reference_1 || ' ' || t.reference_2 || ' ' || t.reference_3 AS "reference",
        u.username AS "createdBy",
        to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
        to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS "updatedAt",
  a.account_name,
  b.code AS "bank_code",
  b.zh AS "bank_name",
  b.en AS "bank_name_en",
  b.logo_url AS "bank_logo"
      FROM 
        transactions t
      LEFT JOIN
        users u ON t.created_by = u.id
      LEFT JOIN
        receiving_accounts a ON t.account_number = a.bank_account
      LEFT JOIN
        banks b ON a.bank_id = b.id
      ${sqlWhere}
      ORDER BY 
        ${sort} ${order === 'asc' ? 'ASC' : 'DESC'}
      LIMIT $1 OFFSET $2
    `, params);
    
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
transactionsRouter.post('/batch-delete', authMiddleware(true), requirePerm('delete_transactions'), async (req, res) => {
  try {
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
      searchTerm
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
    if (searchTerm) {
      whereConditions.push(`(
        account_number ILIKE $${paramIndex} OR
        cheque_ref_no ILIKE $${paramIndex} OR
        reference_1 ILIKE $${paramIndex} OR
        reference_2 ILIKE $${paramIndex} OR
        reference_3 ILIKE $${paramIndex}
      )`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
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
        t.reference_1, t.reference_2, t.reference_3,
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
    if (!Array.isArray(rows) || !rows.length) return res.json({ inserted: 0, failed: 0 })

    let inserted = 0, failed = 0
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
        const ref1 = cleanCell(r.reference1 || r.reference_1) || null
        const ref2 = cleanCell(r.reference2 || r.reference_2) || null
        const ref3 = cleanCell(r.reference3 || r.reference_3) || null

        await query(
          `insert into transactions(
            account_number, transaction_date, cheque_ref_no, description,
            debit_amount, credit_amount, balance, category, reference_1, reference_2, reference_3, created_by
          ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [account, trn, cheque, desc, Number(debit||0), Number(credit||0), balance, category, ref1, ref2, ref3, req.user?.id || null]
        )
        inserted++
      } catch (e) {
        failed++
      }
    }
    return res.json({ inserted, failed })
  } catch (error) {
    console.error('导入交易失败:', error)
    return res.status(500).json({ error: '导入交易失败', detail: error?.message })
  }
})

// 新增交易
transactionsRouter.post('/', authMiddleware(true), requirePerm('manage_transactions'), async (req, res) => {
  try {
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
    const ref1 = reference || null;
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
transactionsRouter.put('/:id', authMiddleware(true), requirePerm('manage_transactions'), async (req, res) => {
  try {
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
    if (reference !== undefined) { fields.push(`reference_1=$${idx++}`); values.push(reference || null); }
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
        (coalesce(t.reference_1,'') || ' ' || coalesce(t.reference_2,'') || ' ' || coalesce(t.reference_3,'')) AS "reference",
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
transactionsRouter.delete('/:id', authMiddleware(true), requirePerm('delete_transactions'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rs = await query('delete from transactions where id=$1 returning id', [id]);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('删除交易失败:', e);
    res.status(500).json({ error: '删除交易失败', detail: e?.message });
  }
});