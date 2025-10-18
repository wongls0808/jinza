// 交易管理相关API
import express from 'express';
import { query } from './db.js';
import * as auth from './auth.js';
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
    -- 删除可能有问题的旧约束
    DROP INDEX IF EXISTS ux_transactions_unique;
    -- 创建新的唯一约束，处理NULL值
    CREATE UNIQUE INDEX IF NOT EXISTS ux_transactions_unique_fixed 
    ON transactions(account_number, transaction_date, COALESCE(cheque_ref_no, ''), debit_amount, credit_amount);
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

// 获取交易列表，支持分页、排序和筛选
transactionsRouter.get('/', auth.authMiddleware(true), auth.readOpenOr('view_transactions'), async (req, res) => {
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
      searchAmountOnly = '0',
      status = 'all'
    } = req.query;
    
    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;
    
    // 日期筛选
    if (startDate) {
      whereClause += ` AND transaction_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND transaction_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    // 账户筛选
    if (account) {
      whereClause += ` AND account_number ILIKE $${paramIndex}`;
      queryParams.push(`%${account}%`);
      paramIndex++;
    }
    
    // 类别筛选
    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    // 金额范围筛选
    if (minAmount) {
      whereClause += ` AND (debit_amount >= $${paramIndex} OR credit_amount >= $${paramIndex})`;
      queryParams.push(parseFloat(minAmount));
      paramIndex++;
    }
    
    if (maxAmount) {
      whereClause += ` AND (debit_amount <= $${paramIndex} AND credit_amount <= $${paramIndex})`;
      queryParams.push(parseFloat(maxAmount));
      paramIndex++;
    }
    
    // 搜索条件
    if (searchTerm) {
      if (searchAmountOnly === '1') {
        // 仅搜索金额
        whereClause += ` AND (debit_amount::text ILIKE $${paramIndex} OR credit_amount::text ILIKE $${paramIndex})`;
        queryParams.push(`%${searchTerm}%`);
        paramIndex++;
      } else {
        // 搜索所有文本字段
        whereClause += ` AND (account_number ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR cheque_ref_no ILIKE $${paramIndex} OR reference_1 ILIKE $${paramIndex} OR reference_2 ILIKE $${paramIndex} OR reference_3 ILIKE $${paramIndex})`;
        queryParams.push(`%${searchTerm}%`);
        paramIndex++;
      }
    }
    
    // 匹配状态筛选
    if (status === 'pending') {
      whereClause += ` AND (matched = false OR matched IS NULL)`;
    } else if (status === 'matched') {
      whereClause += ` AND matched = true`;
    }
    
    // 排序条件
    const orderClause = `ORDER BY ${sort} ${order.toUpperCase()}`;
    
    // 查询数据，关联银行账户信息
    const dataQuery = `
      SELECT 
        t.id,
        t.account_number,
        t.transaction_date as trn_date,
        t.cheque_ref_no,
        t.description as transaction_description,
        t.debit_amount,
        t.credit_amount,
        t.balance,
        t.category,
        t.reference_1 as reference,
        t.reference_2,
        t.reference_3,
        t.matched,
        t.match_type,
        t.match_target_name,
        t.created_by,
        t.created_at,
        COALESCE(b.zh, b.en, '') as bank_name,
        COALESCE(a.account_name, '') as account_name,
        COALESCE(b.code, '') as bank_code
      FROM transactions t
      LEFT JOIN receiving_accounts a ON a.bank_account = t.account_number
      LEFT JOIN banks b ON b.id = a.bank_id
      ${whereClause} 
      ${orderClause} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // 统计查询，需要使用相同的关联表结构
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM transactions t
      LEFT JOIN receiving_accounts a ON a.bank_account = t.account_number
      LEFT JOIN banks b ON b.id = a.bank_id
      ${whereClause}
    `;
    const countParams = queryParams.slice(0, -2);
    
    // 执行查询
    const [dataResult, countResult] = await Promise.all([
      query(dataQuery, queryParams),
      query(countQuery, countParams)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const pages = Math.ceil(total / limit);
    
    res.json({
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('获取交易数据失败:', error);
    res.status(500).json({ error: '获取交易数据失败', detail: error.message });
  }
});

// 批量删除交易（兼容批量/单条删除权限）
transactionsRouter.post('/batch-delete', auth.authMiddleware(true), auth.requireAnyPerm('transactions:batch_delete','transactions:delete'), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '无效的请求参数' });
    }

    // 统一将 ids 转为整数并去重、去除非法值
    const idsInt = [...new Set(
      ids
        .map(v => {
          const n = Number(v)
          return Number.isFinite(n) ? Math.trunc(n) : NaN
        })
        .filter(n => Number.isInteger(n) && n > 0)
    )]

    if (idsInt.length === 0) {
      return res.status(400).json({ error: '无效的ID列表' })
    }

    await ensureTransactionsDDL()
    
    // 使用 ANY($1::int[]) 操作符进行批量删除，避免 integer=text 类型不匹配
    const deleteQuery = `DELETE FROM transactions WHERE id = ANY($1::int[])`;
    const result = await query(deleteQuery, [idsInt]);
    
    res.json({
      success: true,
      deletedCount: result.rowCount,
      message: `成功删除 ${result.rowCount} 条交易记录`
    });
  } catch (error) {
    console.error('批量删除交易失败:', error);
    res.status(500).json({ error: '批量删除交易失败', detail: error?.message || String(error) });
  }
});

// 获取交易统计数据
transactionsRouter.get('/stats', auth.authMiddleware(true), auth.readOpenOr('view_transactions'), async (req, res) => {
  try {
    const { 
      startDate,
      endDate,
      account,
      category 
    } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;
    
    // 应用相同的筛选条件
    if (startDate) {
      whereClause += ` AND transaction_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND transaction_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    if (account) {
      whereClause += ` AND account_number ILIKE $${paramIndex}`;
      queryParams.push(`%${account}%`);
      paramIndex++;
    }
    
    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    // 总体统计
    const summaryQuery = `
      SELECT 
        COUNT(*) as totalTransactions,
        COALESCE(SUM(debit_amount), 0) as totalDebit,
        COALESCE(SUM(credit_amount), 0) as totalCredit,
        COALESCE(SUM(credit_amount) - SUM(debit_amount), 0) as netBalance
      FROM transactions 
      ${whereClause}
    `;
    
    // 按月统计
    const monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        COALESCE(SUM(debit_amount), 0) as totalDebit,
        COALESCE(SUM(credit_amount), 0) as totalCredit,
        COUNT(*) as transactionCount
      FROM transactions 
      ${whereClause}
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month DESC
      LIMIT 12
    `;
    
    // 按类别统计
    const categoryQuery = `
      SELECT 
        COALESCE(category, '未分类') as category,
        COALESCE(SUM(debit_amount), 0) as totalDebit,
        COALESCE(SUM(credit_amount), 0) as totalCredit,
        COUNT(*) as transactionCount
      FROM transactions 
      ${whereClause}
      GROUP BY category
      ORDER BY (SUM(debit_amount) + SUM(credit_amount)) DESC
      LIMIT 10
    `;
    
    // 执行所有查询
    const [summaryResult, monthlyResult, categoryResult] = await Promise.all([
      query(summaryQuery, queryParams),
      query(monthlyQuery, queryParams),
      query(categoryQuery, queryParams)
    ]);
    
    res.json({
      summary: summaryResult.rows[0],
      monthly: monthlyResult.rows,
      categories: categoryResult.rows
    });
  } catch (error) {
    console.error('获取交易统计失败:', error);
    res.status(500).json({ error: '获取交易统计失败', detail: error.message });
  }
});

// 导出交易数据
transactionsRouter.get('/export', auth.authMiddleware(true), auth.readOpenOr('view_transactions'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { 
      startDate,
      endDate,
      account,
      category,
      searchTerm,
      searchAmountOnly = '0'
    } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;
    
    // 应用筛选条件（与列表查询相同）
    if (startDate) {
      whereClause += ` AND transaction_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND transaction_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    if (account) {
      whereClause += ` AND account_number ILIKE $${paramIndex}`;
      queryParams.push(`%${account}%`);
      paramIndex++;
    }
    
    if (category) {
      whereClause += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    if (searchTerm) {
      if (searchAmountOnly === '1') {
        whereClause += ` AND (debit_amount::text ILIKE $${paramIndex} OR credit_amount::text ILIKE $${paramIndex})`;
        queryParams.push(`%${searchTerm}%`);
        paramIndex++;
      } else {
        whereClause += ` AND (account_number ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR cheque_ref_no ILIKE $${paramIndex} OR reference_1 ILIKE $${paramIndex})`;
        queryParams.push(`%${searchTerm}%`);
        paramIndex++;
      }
    }
    
    const exportQuery = `
      SELECT 
        account_number,
        transaction_date,
        cheque_ref_no,
        description as transaction_description,
        debit_amount,
        credit_amount,
        reference_1 as reference
      FROM transactions 
      ${whereClause}
      ORDER BY transaction_date DESC, id DESC
    `;
    
    const result = await query(exportQuery, queryParams);
    res.json(result.rows);
  } catch (e) {
    console.error('export failed', e)
    res.status(500).json({ error: '导出交易失败', detail: e?.message });
  }
});

// 新增交易
transactionsRouter.post('/', auth.authMiddleware(true), auth.requirePerm('transactions:create'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { 
      account_number, 
      transaction_date, 
      cheque_ref_no, 
      description, 
      debit_amount = 0, 
      credit_amount = 0, 
      category = '', 
      reference = '' 
    } = req.body
    
    if (!account_number || !transaction_date) {
      return res.status(400).json({ error: '缺少必要字段' });
    }
    
    const insertQuery = `
      INSERT INTO transactions (
        account_number, transaction_date, cheque_ref_no, description, 
        debit_amount, credit_amount, category, reference_1, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const rs = await query(insertQuery, [
      account_number, transaction_date, cheque_ref_no, description,
      debit_amount, credit_amount, category, reference, req.user?.id || null
    ]);
    
    // 返回创建的交易记录及其银行信息
    const createdTransaction = await query(`
      SELECT 
        t.id,
        t.account_number,
        t.transaction_date as trn_date,
        t.cheque_ref_no,
        t.description as transaction_description,
        t.debit_amount,
        t.credit_amount,
        t.balance,
        t.category,
        t.reference_1 as reference,
        COALESCE(b.zh, b.en, '') as bank_name,
        COALESCE(a.account_name, '') as account_name,
        COALESCE(b.code, '') as bank_code
      FROM transactions t
      LEFT JOIN receiving_accounts a ON a.bank_account = t.account_number
      LEFT JOIN banks b ON b.id = a.bank_id
      WHERE t.id = $1
    `, [rs.rows[0].id]);

    res.json(createdTransaction.rows[0]);
  } catch (e) {
    console.error('create transaction failed', e)
    res.status(500).json({ error: '新增交易失败', detail: e?.message });
  }
});

// 更新交易
transactionsRouter.put('/:id', auth.authMiddleware(true), auth.requirePerm('transactions:update'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { id } = req.params
    const { 
      account_number, 
      transaction_date, 
      cheque_ref_no, 
      description, 
      debit_amount, 
      credit_amount, 
      category, 
      reference 
    } = req.body
    
    const fields = []
    const values = []
    let idx = 1
    
    if (account_number !== undefined) { fields.push(`account_number = $${idx++}`); values.push(account_number) }
    if (transaction_date !== undefined) { fields.push(`transaction_date = $${idx++}`); values.push(transaction_date) }
    if (cheque_ref_no !== undefined) { fields.push(`cheque_ref_no = $${idx++}`); values.push(cheque_ref_no) }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description) }
    if (debit_amount !== undefined) { fields.push(`debit_amount = $${idx++}`); values.push(debit_amount) }
    if (credit_amount !== undefined) { fields.push(`credit_amount = $${idx++}`); values.push(credit_amount) }
    if (category !== undefined) { fields.push(`category = $${idx++}`); values.push(category) }
    if (reference !== undefined) { fields.push(`reference_1 = $${idx++}`); values.push(reference) }
    
    if (!fields.length) return res.status(400).json({ error: '无修改内容' });
    
    fields.push(`updated_at = NOW()`)
    values.push(id)
    
    const updateQuery = `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${idx}`;
    const rs = await query(updateQuery, values);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id });
  } catch (e) {
    console.error('update transaction failed', e)
    res.status(500).json({ error: '更新交易失败', detail: e?.message });
  }
});

// 删除交易
transactionsRouter.delete('/:id', auth.authMiddleware(true), auth.requirePerm('transactions:delete'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { id } = req.params
    const rs = await query('DELETE FROM transactions WHERE id = $1', [id]);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('delete transaction failed', e)
    res.status(500).json({ error: '删除交易失败', detail: e?.message });
  }
});

// 交易匹配
transactionsRouter.post('/:id/match', auth.authMiddleware(true), auth.requirePerm('transactions:match'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { id } = req.params
    const { type, targetId, targetName } = req.body
    
    if (!type || !targetId) {
      return res.status(400).json({ error: '缺少匹配参数' });
    }
    const t = String(type).toLowerCase()

    // 特殊处理：匹配到平台商（buyfx）时，联动更新平台商余额
    if (t === 'buyfx') {
      const pid = Number(targetId)
      if (!Number.isInteger(pid) || pid <= 0) return res.status(400).json({ error: 'invalid platform id' })

      // 读取交易金额与收款账户币种
      const tr = await query(`
        select t.debit_amount as debit, t.credit_amount as credit, a.currency_code as currency
        from transactions t
        left join receiving_accounts a on a.bank_account = t.account_number
        where t.id=$1
      `, [id])
      if (!tr.rowCount) return res.status(404).json({ error: 'Transaction not found' })
      const { debit, credit, currency } = tr.rows[0]
      const cur = String(currency || '').toUpperCase()
      const field = cur === 'USD' ? 'balance_usd' : (cur === 'MYR' ? 'balance_myr' : (cur === 'CNY' ? 'balance_cny' : null))
      if (!field) return res.status(400).json({ error: `unsupported currency ${cur}` })

      const delta = Number(debit || 0) - Number(credit || 0)
      // 平台余额 += delta（借方为正，贷方为负）
      await query(`update fx_platforms set ${field} = coalesce(${field},0) + $1 where id=$2`, [delta, pid])

      const matched_by = req.user?.id || null
      const name = (targetName || '').toString().trim() || null
      const rs = await query(
        `update transactions set matched=true, match_type=$1, match_target_id=$2, match_target_name=$3, matched_by=$4, matched_at=now() where id=$5`,
        [t, pid, name, matched_by, id]
      )
      if (rs.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' })
      return res.json({ success: true })
    }

    // 其他类型：按原逻辑仅更新匹配字段
    const updateQuery = `
      UPDATE transactions 
      SET matched = true, match_type = $1, match_target_id = $2, match_target_name = $3, 
          matched_by = $4, matched_at = NOW()
      WHERE id = $5
    `;
    const rs = await query(updateQuery, [t, targetId, targetName, req.user?.id || null, id]);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('match transaction failed', e)
    res.status(500).json({ error: '匹配交易失败', detail: e?.message });
  }
});

// 取消匹配
transactionsRouter.post('/:id/unmatch', auth.authMiddleware(true), auth.requirePerm('transactions:match'), async (req, res) => {
  try {
    await ensureTransactionsDDL()
    const { id } = req.params

    // 读取当前匹配信息与交易金额、币种
    const tr = await query(`
      select t.id, t.matched, t.match_type, t.match_target_id,
             t.debit_amount as debit, t.credit_amount as credit,
             a.currency_code as currency
      from transactions t
      left join receiving_accounts a on a.bank_account = t.account_number
      where t.id=$1
    `, [id])
    if (!tr.rowCount) return res.status(404).json({ error: 'Transaction not found' })
    const row = tr.rows[0]

    // 若是 buyfx 平台商匹配，回滚平台余额（与匹配时相反）
    if (row.matched && String(row.match_type || '').toLowerCase() === 'buyfx' && row.match_target_id) {
      const pid = Number(row.match_target_id)
      const cur = String(row.currency || '').toUpperCase()
      const field = cur === 'USD' ? 'balance_usd' : (cur === 'MYR' ? 'balance_myr' : (cur === 'CNY' ? 'balance_cny' : null))
      if (!field) return res.status(400).json({ error: `unsupported currency ${cur}` })
      const delta = Number(row.debit || 0) - Number(row.credit || 0)
      // 回滚：平台余额 -= delta
      await query(`update fx_platforms set ${field} = coalesce(${field},0) - $1 where id=$2`, [delta, pid])
    }

    // 清空匹配信息
    const rs = await query(
      `update transactions set matched=false, match_type=null, match_target_id=null, match_target_name=null, matched_by=null, matched_at=null, updated_at=now() where id=$1`,
      [id]
    )
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' })
    res.json({ success: true });
  } catch (e) {
    console.error('unmatch transaction failed', e)
    res.status(500).json({ error: '取消匹配失败', detail: e?.message });
  }
});

// 简单的CSV导入功能
transactionsRouter.post('/simple-import', auth.authMiddleware(true), auth.requirePerm('transactions:import'), async (req, res) => {
  try {
    // 验证数据库连接和表结构
    await ensureTransactionsDDL()
    
    // 测试数据库连接
    await query('SELECT 1 as test');
    
    const { rows } = req.body;
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: '导入数据为空' });
    }
    
    let inserted = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];
    
    console.log('开始导入', rows.length, '条记录');
    console.log('用户:', req.user?.username || req.user?.id || 'unknown');
    
    for (const [index, row] of rows.entries()) {
      try {
        const {
          accountNumber,
          transactionDate,
          chequeRefNo = '',
          description = '',
          debitAmount = 0,
          creditAmount = 0,
          reference = ''  // 这是前端合并的Reference 1-6
        } = row;
        
        console.log(`处理第 ${index + 1} 条记录:`, {
          accountNumber,
          transactionDate,
          chequeRefNo,
          debitAmount,
          creditAmount,
          referenceLength: reference?.length || 0
        });
        
        // 服务端二次清理数据（防止前端遗漏）
        const serverCleanValue = (value) => {
          if (!value) return '';
          return String(value)
            .replace(/^=".*"$/, '')     // 移除Excel格式
            .replace(/^"+|"+$/g, '')    // 移除前后引号
            .replace(/^\s*-\s*$/, '')   // 移除只有-的内容
            .trim();
        };
        
        if (!accountNumber || !transactionDate) {
          failed++;
          const error = `第 ${index + 1} 条记录缺少必要字段: 账户号(${accountNumber}) 或交易日期(${transactionDate})`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        // 验证和清理金额数据
        let debitAmt = 0;
        let creditAmt = 0;
        
        try {
          debitAmt = Number(debitAmount) || 0;
          creditAmt = Number(creditAmount) || 0;
        } catch (e) {
          failed++;
          const error = `第 ${index + 1} 条记录金额格式错误`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        // 验证金额范围 (numeric(18,2) 最大值约为 10^16)
        const MAX_AMOUNT = 999999999999999.99;
        if (debitAmt < 0 || creditAmt < 0) {
          failed++;
          const error = `第 ${index + 1} 条记录金额不能为负数`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        if (debitAmt > MAX_AMOUNT || creditAmt > MAX_AMOUNT) {
          failed++;
          const error = `第 ${index + 1} 条记录金额超出范围`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        if (debitAmt === 0 && creditAmt === 0) {
          failed++;
          const error = `第 ${index + 1} 条记录借方和贷方金额都为0`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        // 业务逻辑验证：通常借方和贷方不能同时有值
        if (debitAmt > 0 && creditAmt > 0) {
          console.warn(`第 ${index + 1} 条记录借方和贷方同时有值，这可能不符合会计准则`);
        }
        
        // 严格按照数据库字段规则清理数据（应用服务端二次清理）
        const cleanAccountNumber = serverCleanValue(accountNumber).substring(0, 64);
        const cleanChequeRefNo = serverCleanValue(chequeRefNo).substring(0, 128);
        const cleanDescription = serverCleanValue(description); // text类型无长度限制
        const cleanReference = serverCleanValue(reference).substring(0, 128); // Reference 1-6合并后的内容
        
        // 验证NOT NULL字段
        if (!cleanAccountNumber) {
          failed++;
          const error = `第 ${index + 1} 条记录账户号码为空`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        // 验证日期格式 (必须是有效的 YYYY-MM-DD 格式)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(transactionDate)) {
          failed++;
          const error = `第 ${index + 1} 条记录日期格式无效: ${transactionDate}`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        // 验证日期是否为有效日期
        const testDate = new Date(transactionDate);
        if (isNaN(testDate.getTime()) || testDate.toISOString().substring(0, 10) !== transactionDate) {
          failed++;
          const error = `第 ${index + 1} 条记录日期无效: ${transactionDate}`;
          errors.push(error);
          console.warn(error);
          continue;
        }
        
        // 处理cheque_ref_no：空字符串转为NULL，与约束逻辑保持一致
        const dbChequeRefNo = cleanChequeRefNo || null;
        
        // 按照唯一约束的确切逻辑检查重复
        const checkQuery = `
          SELECT id FROM transactions 
          WHERE account_number = $1 
            AND transaction_date = $2 
            AND COALESCE(cheque_ref_no, '') = COALESCE($3, '')
            AND debit_amount = $4 
            AND credit_amount = $5
        `;
        
        const existingRecord = await query(checkQuery, [
          cleanAccountNumber, transactionDate, dbChequeRefNo, debitAmt, creditAmt
        ]);
        
        if (existingRecord.rows.length > 0) {
          skipped++;
          console.log(`第 ${index + 1} 条记录已存在，跳过 (ID: ${existingRecord.rows[0].id})`);
          continue;
        }
        
        const insertQuery = `
          INSERT INTO transactions (
            account_number, transaction_date, cheque_ref_no, description, 
            debit_amount, credit_amount, reference_1, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        
        const params = [
          cleanAccountNumber, 
          transactionDate, 
          dbChequeRefNo,  // 使用NULL而不是空字符串 
          cleanDescription,
          debitAmt, 
          creditAmt, 
          cleanReference, 
          req.user?.id || null
        ];
        
        console.log(`第 ${index + 1} 条记录 - 执行SQL参数:`, {
          account_number: params[0],
          transaction_date: params[1],
          cheque_ref_no: params[2],
          description: params[3]?.substring(0, 50) + (params[3]?.length > 50 ? '...' : ''),
          debit_amount: params[4],
          credit_amount: params[5],
          reference_1: params[6]
        });
        
        const result = await query(insertQuery, params);
        
        if (result.rows.length > 0) {
          inserted++;
          console.log(`第 ${index + 1} 条记录插入成功, ID: ${result.rows[0].id}`);
        } else {
          // 这种情况理论上不应该发生，因为我们已经检查了重复
          console.warn(`第 ${index + 1} 条记录插入无返回，可能的并发问题`);
        }
      } catch (error) {
        failed++;
        let errorMsg = `第 ${index + 1} 条记录导入失败: ${error.message}`;
        
        // 检测具体的数据库错误类型
        if (error.code === '23505') {  // 唯一约束违反
          errorMsg = `第 ${index + 1} 条记录重复（唯一约束冲突）`;
        } else if (error.code === '22001') {  // 字符串长度超出
          errorMsg = `第 ${index + 1} 条记录数据长度超出限制`;
        } else if (error.code === '23502') {  // NOT NULL约束违反
          errorMsg = `第 ${index + 1} 条记录缺少必要字段`;
        } else if (error.code === '22P02') {  // 数据格式错误
          errorMsg = `第 ${index + 1} 条记录数据格式错误`;
        }
        
        errors.push(errorMsg);
        console.error(errorMsg, {
          code: error.code,
          detail: error.detail,
          constraint: error.constraint,
          rowData: { cleanAccountNumber, transactionDate, safeRecordChequeRefNo, debitAmt, creditAmt }
        });
      }
    }
    
    res.json({
      success: true,
      inserted,
      skipped,
      failed,
      errors: failed > 0 ? errors.slice(0, 5) : [] // 最多返回5个错误信息
    });
    
  } catch (error) {
    console.error('简单导入失败:', error);
    res.status(500).json({ error: '导入失败', detail: error.message });
  }
});