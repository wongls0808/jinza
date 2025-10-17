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
    
    // 查询数据
    const dataQuery = `
      SELECT 
        id,
        account_number,
        transaction_date as trn_date,
        cheque_ref_no,
        description as transaction_description,
        debit_amount,
        credit_amount,
        balance,
        category,
        reference_1 as reference,
        reference_2,
        reference_3,
        matched,
        match_type,
        match_target_name,
        created_by,
        created_at,
        '' as bank_name,
        '' as account_name,
        '' as bank_code
      FROM transactions 
      ${whereClause} 
      ${orderClause} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // 统计查询
    const countQuery = `SELECT COUNT(*) as total FROM transactions ${whereClause}`;
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

// 批量删除交易
transactionsRouter.delete('/batch', auth.authMiddleware(true), auth.requirePerm('transactions:delete'), async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '无效的请求参数' });
    }
    
    await ensureTransactionsDDL()
    
    // 使用 ANY() 操作符进行批量删除
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const deleteQuery = `DELETE FROM transactions WHERE id = ANY(ARRAY[${placeholders}])`;
    
    const result = await query(deleteQuery, ids);
    
    res.json({
      success: true,
      deletedCount: result.rowCount,
      message: `成功删除 ${result.rowCount} 条交易记录`
    });
  } catch (error) {
    console.error('批量删除交易失败:', error);
    res.status(500).json({ error: '批量删除交易失败', detail: error.message });
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
    
    res.json({ id: rs.rows[0].id });
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
    
    const updateQuery = `
      UPDATE transactions 
      SET matched = true, match_type = $1, match_target_id = $2, match_target_name = $3, 
          matched_by = $4, matched_at = NOW()
      WHERE id = $5
    `;
    
    const rs = await query(updateQuery, [type, targetId, targetName, req.user?.id || null, id]);
    if (rs.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    
    res.json({ success: true });
  } catch (e) {
    console.error('match transaction failed', e)
    res.status(500).json({ error: '匹配交易失败', detail: e?.message });
  }
});