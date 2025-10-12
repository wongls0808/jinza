// 交易管理相关API
import express from 'express';
import { query } from './db.js';
import { authMiddleware, requirePerm } from './auth.js';
import { parseCSV } from './utils.js';
import { getMockTransactions, getMockTransactionStats } from './mockTransactions.js';

export const transactionsRouter = express.Router();

// 获取交易列表，支持分页、排序和筛选
transactionsRouter.get('/', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    // 检查数据库连接
    if (!process.env.DATABASE_URL) {
      // 使用模拟数据
      console.log('使用模拟交易数据...');
      return res.json(getMockTransactions(req.query));
    }
    
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
    
    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    
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
        description ILIKE $${paramIndex} OR
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
        t.account_number AS "accountNumber",
        to_char(t.transaction_date, 'YYYY-MM-DD') AS "transactionDate",
        t.cheque_ref_no AS "chequeRefNo",
        t.description,
        t.debit_amount AS "debitAmount",
        t.credit_amount AS "creditAmount",
        t.balance,
        t.category,
        t.reference_1 AS "reference1",
        t.reference_2 AS "reference2",
        t.reference_3 AS "reference3",
        u.username AS "createdBy",
        to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
        to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS "updatedAt"
      FROM 
        transactions t
      LEFT JOIN
        users u ON t.created_by = u.id
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

// 获取交易统计信息
transactionsRouter.get('/stats', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    // 检查数据库连接
    if (!process.env.DATABASE_URL) {
      // 使用模拟数据
      console.log('使用模拟交易统计数据...');
      return res.json(getMockTransactionStats(req.query));
    }
    
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

// 获取单个交易详情
transactionsRouter.get('/:id', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    const id = req.params.id;
    
    const result = await query(`
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
        t.reference_1 AS "reference1",
        t.reference_2 AS "reference2",
        t.reference_3 AS "reference3",
        u.username AS "createdBy",
        to_char(t.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
        to_char(t.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS "updatedAt"
      FROM 
        transactions t
      LEFT JOIN
        users u ON t.created_by = u.id
      WHERE 
        t.id = $1
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '找不到该交易记录' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取交易详情失败:', error);
    res.status(500).json({ error: '获取交易详情失败', detail: error.message });
  }
});

// 创建新交易
transactionsRouter.post('/', authMiddleware(true), requirePerm('manage_transactions'), async (req, res) => {
  try {
    const {
      accountNumber,
      transactionDate,
      chequeRefNo,
      description,
      debitAmount,
      creditAmount,
      category,
      reference1,
      reference2,
      reference3
    } = req.body;
    
    // 验证必要字段
    if (!accountNumber || !transactionDate) {
      return res.status(400).json({ error: '账号和交易日期为必填字段' });
    }
    
    // 计算余额
    const balance = Number(creditAmount || 0) - Number(debitAmount || 0);
    
    const result = await query(`
      INSERT INTO transactions (
        account_number,
        transaction_date,
        cheque_ref_no,
        description,
        debit_amount,
        credit_amount,
        balance,
        category,
        reference_1,
        reference_2,
        reference_3,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `, [
      accountNumber,
      transactionDate,
      chequeRefNo || null,
      description || null,
      Number(debitAmount || 0),
      Number(creditAmount || 0),
      balance,
      category || null,
      reference1 || null,
      reference2 || null,
      reference3 || null,
      req.user.id
    ]);
    
    res.status(201).json({ 
      message: '交易创建成功',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('创建交易失败:', error);
    res.status(500).json({ error: '创建交易失败', detail: error.message });
  }
});

// 更新交易
transactionsRouter.put('/:id', authMiddleware(true), requirePerm('manage_transactions'), async (req, res) => {
  try {
    const id = req.params.id;
    const {
      accountNumber,
      transactionDate,
      chequeRefNo,
      description,
      debitAmount,
      creditAmount,
      category,
      reference1,
      reference2,
      reference3
    } = req.body;
    
    // 验证必要字段
    if (!accountNumber || !transactionDate) {
      return res.status(400).json({ error: '账号和交易日期为必填字段' });
    }
    
    // 计算余额
    const balance = Number(creditAmount || 0) - Number(debitAmount || 0);
    
    const result = await query(`
      UPDATE transactions SET
        account_number = $1,
        transaction_date = $2,
        cheque_ref_no = $3,
        description = $4,
        debit_amount = $5,
        credit_amount = $6,
        balance = $7,
        category = $8,
        reference_1 = $9,
        reference_2 = $10,
        reference_3 = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING id
    `, [
      accountNumber,
      transactionDate,
      chequeRefNo || null,
      description || null,
      Number(debitAmount || 0),
      Number(creditAmount || 0),
      balance,
      category || null,
      reference1 || null,
      reference2 || null,
      reference3 || null,
      id
    ]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '找不到该交易记录' });
    }
    
    res.json({ message: '交易更新成功' });
  } catch (error) {
    console.error('更新交易失败:', error);
    res.status(500).json({ error: '更新交易失败', detail: error.message });
  }
});

// 删除交易
transactionsRouter.delete('/:id', authMiddleware(true), requirePerm('manage_transactions'), async (req, res) => {
  try {
    const id = req.params.id;
    
    const result = await query('DELETE FROM transactions WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '找不到该交易记录' });
    }
    
    res.json({ message: '交易删除成功' });
  } catch (error) {
    console.error('删除交易失败:', error);
    res.status(500).json({ error: '删除交易失败', detail: error.message });
  }
});

// 批量导入交易
transactionsRouter.post('/import', authMiddleware(true), requirePerm('manage_transactions'), async (req, res) => {
  try {
    const { rows, options = {} } = req.body;
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: '没有有效的数据' });
    }
    
    const processedRows = [];
    const errors = [];
    
    // 处理CSV数据
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        
        // 检查必要字段
        if (!row.accountNumber || !row.transactionDate) {
          errors.push({ row: i + 1, error: '账号和交易日期为必填字段' });
          continue;
        }
        
        // 处理日期格式
        let transactionDate;
        try {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(row.transactionDate)) {
            const dateObj = new Date(row.transactionDate);
            if (isNaN(dateObj.getTime())) {
              errors.push({ row: i + 1, error: '无效的日期格式' });
              continue;
            }
            transactionDate = dateObj.toISOString().split('T')[0];
          } else {
            transactionDate = row.transactionDate;
          }
        } catch (e) {
          errors.push({ row: i + 1, error: '日期格式错误: ' + e.message });
          continue;
        }
        
        // 处理金额
        let debitAmount = 0;
        let creditAmount = 0;
        
        if (row.debitAmount) {
          debitAmount = Number(String(row.debitAmount).replace(/,/g, ''));
          if (isNaN(debitAmount)) {
            errors.push({ row: i + 1, error: '借方金额格式错误' });
            continue;
          }
        }
        
        if (row.creditAmount) {
          creditAmount = Number(String(row.creditAmount).replace(/,/g, ''));
          if (isNaN(creditAmount)) {
            errors.push({ row: i + 1, error: '贷方金额格式错误' });
            continue;
          }
        }
        
        // 计算余额
        const balance = creditAmount - debitAmount;
        
        // 添加处理后的数据
        processedRows.push({
          accountNumber: String(row.accountNumber).trim(),
          transactionDate,
          chequeRefNo: row.chequeRefNo ? String(row.chequeRefNo).trim() : null,
          description: row.description ? String(row.description).trim() : null,
          debitAmount,
          creditAmount,
          balance,
          category: row.category ? String(row.category).trim() : null,
          reference1: row.reference1 ? String(row.reference1).trim() : null,
          reference2: row.reference2 ? String(row.reference2).trim() : null,
          reference3: row.reference3 ? String(row.reference3).trim() : null
        });
      } catch (e) {
        errors.push({ row: i + 1, error: e.message });
      }
    }
    
    // 批量插入处理后的数据
    let inserted = 0;
    const failed = [];
    
    for (const row of processedRows) {
      try {
        const result = await query(`
          INSERT INTO transactions (
            account_number,
            transaction_date,
            cheque_ref_no,
            description,
            debit_amount,
            credit_amount,
            balance,
            category,
            reference_1,
            reference_2,
            reference_3,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (account_number, transaction_date, cheque_ref_no) 
          DO UPDATE SET
            description = EXCLUDED.description,
            debit_amount = EXCLUDED.debit_amount,
            credit_amount = EXCLUDED.credit_amount,
            balance = EXCLUDED.balance,
            category = EXCLUDED.category,
            reference_1 = EXCLUDED.reference_1,
            reference_2 = EXCLUDED.reference_2,
            reference_3 = EXCLUDED.reference_3,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          row.accountNumber,
          row.transactionDate,
          row.chequeRefNo || '',
          row.description,
          row.debitAmount,
          row.creditAmount,
          row.balance,
          row.category,
          row.reference1,
          row.reference2,
          row.reference3,
          req.user.id
        ]);
        
        inserted++;
      } catch (e) {
        failed.push({
          data: row,
          error: e.message
        });
      }
    }
    
    res.json({
      message: `成功导入 ${inserted} 条交易记录`,
      total: rows.length,
      inserted,
      failed: failed.length,
      errors: [...errors, ...failed]
    });
  } catch (error) {
    console.error('批量导入交易失败:', error);
    res.status(500).json({ error: '批量导入交易失败', detail: error.message });
  }
});

// 获取交易导出数据
transactionsRouter.get('/export', authMiddleware(true), requirePerm('view_transactions'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      account,
      category
    } = req.query;
    
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
    
    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    
    if (whereConditions.length > 0) {
      whereClause = 'WHERE ' + whereConditions.join(' AND ');
    }
    
    // 查询数据
    const result = await query(`
      SELECT 
        account_number AS "账号",
        to_char(transaction_date, 'YYYY-MM-DD') AS "交易日期",
        cheque_ref_no AS "支票/参考号",
        description AS "描述",
        debit_amount AS "借方金额",
        credit_amount AS "贷方金额",
        balance AS "余额",
        category AS "类别",
        reference_1 AS "参考1",
        reference_2 AS "参考2",
        reference_3 AS "参考3"
      FROM 
        transactions
      ${whereClause}
      ORDER BY 
        transaction_date DESC, id DESC
    `, params);
    
    // 返回数据
    res.json(result.rows);
  } catch (error) {
    console.error('导出交易数据失败:', error);
    res.status(500).json({ error: '导出交易数据失败', detail: error.message });
  }
});

// 获取交易CSV模板
transactionsRouter.get('/template', authMiddleware(true), requirePerm('manage_transactions'), (req, res) => {
  try {
    const template = [
      {
        "账号": "示例账号",
        "交易日期": "2025-01-01",
        "支票/参考号": "CHQ12345",
        "描述": "示例交易描述",
        "借方金额": 1000,
        "贷方金额": 0,
        "类别": "支出",
        "参考1": "参考信息1",
        "参考2": "参考信息2",
        "参考3": "参考信息3"
      },
      {
        "账号": "示例账号",
        "交易日期": "2025-01-02",
        "支票/参考号": "DEP67890",
        "描述": "示例存款",
        "借方金额": 0,
        "贷方金额": 2000,
        "类别": "收入",
        "参考1": "客户A",
        "参考2": "",
        "参考3": ""
      }
    ];
    
    res.json(template);
  } catch (error) {
    console.error('获取交易模板失败:', error);
    res.status(500).json({ error: '获取交易模板失败', detail: error.message });
  }
});