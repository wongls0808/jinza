import express from 'express';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取数据库连接函数
function getDb() {
  const dataDir = process.env.DATA_DIR ? process.env.DATA_DIR : join(__dirname, '../data');
  const dbPath = join(dataDir, 'app.db');
  return new sqlite3.Database(dbPath);
}

// 从中间件中获取requireAuth函数
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: '请先登录' });
  }
  next();
};

import { generateInvoiceNumber } from '../utils/codeRuleUtils.js';
import { generatePDF } from '../utils/pdfGenerator.js';

const router = express.Router();

// 数据库查询工具函数
function dbQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQL错误(all):', err, '执行的SQL:', sql);
          reject(err);
        } else {
          resolve(rows || []);  // 确保始终返回数组，即使为空
        }
      });
    } catch (error) {
      console.error('执行查询异常:', error);
      reject(error);
    }
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.get(sql, params, (err, row) => {
        if (err) {
          console.error('SQL错误(get):', err, '执行的SQL:', sql);
          reject(err);
        } else {
          resolve(row);  // 可能为undefined，这是正常的
        }
      });
    } catch (error) {
      console.error('执行get异常:', error);
      reject(error);
    }
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('SQL错误(run):', err, '执行的SQL:', sql);
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    } catch (error) {
      console.error('执行run异常:', error);
      reject(error);
    }
  });
}

// 生成唯一9位商品编码
async function generateUniqueProductCode(db) {
  function randomCode() {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      code += digits[Math.floor(Math.random() * 10)];
    }
    return code;
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await dbGet(db, 'SELECT id FROM products WHERE code = ?', [code]);
    if (!existing) return code;
  }
  throw new Error('无法生成唯一商品编码');
}

// 解析或创建商品：根据描述（不区分大小写）查找，不存在则创建（仅在需要入库时）
async function resolveOrCreateProduct(db, description, unit, price, userId) {
  if (!description || !description.trim()) return null;
  const existing = await dbGet(db, 'SELECT * FROM products WHERE description = ? COLLATE NOCASE', [description.trim()]);
  if (existing) return { id: existing.id, code: existing.code, unit: existing.unit };
  // 创建新商品
  const code = await generateUniqueProductCode(db);
  const result = await dbRun(db, `
    INSERT INTO products (code, description, unit, selling_price, created_by)
    VALUES (?, ?, ?, ?, ?)
  `, [code, description.trim(), unit || '', parseFloat(price || 0) || 0, userId]);
  return { id: result.lastID, code, unit: unit || '' };
}

// 获取所有发票
router.get('/', async (req, res) => {
  const db = getDb();
  
  try {
    let query = `
      SELECT i.*, 
        c.name as customer_name, 
        s.name as salesperson_name,
        s.nickname as salesperson_nickname,
        a.name as account_set_name,
        uc.name as created_by_name,
        uu.name as updated_by_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN salespeople s ON i.salesperson_id = s.id
      LEFT JOIN account_sets a ON i.account_set_id = a.id
      LEFT JOIN users uc ON i.created_by = uc.id
      LEFT JOIN users uu ON i.updated_by = uu.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // 添加查询过滤条件
    if (req.query.customer_id) {
      query += ' AND i.customer_id = ?';
      params.push(req.query.customer_id);
    }
    
    if (req.query.account_set_id) {
      query += ' AND i.account_set_id = ?';
      params.push(req.query.account_set_id);
    }
    
    if (req.query.salesperson_id) {
      query += ' AND i.salesperson_id = ?';
      params.push(req.query.salesperson_id);
    }
    
    if (req.query.status) {
      query += ' AND i.status = ?';
      params.push(req.query.status);
    }
    
    if (req.query.payment_status) {
      query += ' AND i.payment_status = ?';
      params.push(req.query.payment_status);
    }
    
    if (req.query.start_date && req.query.end_date) {
      query += ' AND i.invoice_date BETWEEN ? AND ?';
      params.push(req.query.start_date, req.query.end_date);
    }
    
    if (req.query.search) {
      query += ' AND (i.invoice_number LIKE ? OR c.name LIKE ?)';
      const searchTerm = `%${req.query.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // 添加排序
    query += ' ORDER BY i.invoice_date DESC, i.id DESC';
    
    // 添加分页
    if (req.query.limit) {
      const limit = parseInt(req.query.limit) || 20;
      let offset = 0;
      if (req.query.page) {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        offset = (page - 1) * limit;
      } else if (req.query.offset) {
        offset = parseInt(req.query.offset) || 0;
      }
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    
    const invoices = await dbQuery(db, query, params);
    
    // 获取总数
    // 统计总数时也需要构建相同的过滤语句与参数（否则会出现占位符数量不匹配导致500）
    let totalQuery = `
      SELECT COUNT(*) as total
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const totalParams = [];
    if (req.query.customer_id) {
      totalQuery += ' AND i.customer_id = ?';
      totalParams.push(req.query.customer_id);
    }
    if (req.query.account_set_id) {
      totalQuery += ' AND i.account_set_id = ?';
      totalParams.push(req.query.account_set_id);
    }
    if (req.query.salesperson_id) {
      totalQuery += ' AND i.salesperson_id = ?';
      totalParams.push(req.query.salesperson_id);
    }
    if (req.query.status) {
      totalQuery += ' AND i.status = ?';
      totalParams.push(req.query.status);
    }
    if (req.query.payment_status) {
      totalQuery += ' AND i.payment_status = ?';
      totalParams.push(req.query.payment_status);
    }
    if (req.query.start_date && req.query.end_date) {
      totalQuery += ' AND i.invoice_date BETWEEN ? AND ?';
      totalParams.push(req.query.start_date, req.query.end_date);
    }
    if (req.query.search) {
      totalQuery += ' AND (i.invoice_number LIKE ? OR c.name LIKE ?)';
      const searchTerm = `%${req.query.search}%`;
      totalParams.push(searchTerm, searchTerm);
    }
    const countResult = await dbGet(db, totalQuery, totalParams);
    
    res.json({
      total: countResult ? countResult.total : 0,
      invoices
    });
  } catch (error) {
    console.error('获取发票列表失败:', error);
    res.status(500).json({ error: '获取发票列表失败' });
  } finally {
    // 关闭数据库连接，但捕获可能的错误
    try {
      db.close();
    } catch (dbError) {
      console.error('关闭数据库连接失败:', dbError);
    }
  }
});

// 注意：在声明 '/:id' 之前注册更具体的路由以避免被参数路由截获
// 获取发票统计数据
router.get('/stats', async (req, res) => {
  const db = getDb();
  
  try {
    // 处理账套过滤条件
    let accountSetFilter = '';
    let params = [];
    
    if (req.query.account_set_id) {
      accountSetFilter = 'WHERE account_set_id = ?';
      params.push(req.query.account_set_id);
    }
    
    // 获取总发票数
    const totalResult = await dbGet(db, 
      `SELECT COUNT(*) as total FROM invoices ${accountSetFilter}`, 
      params
    );
    
    // 获取未付款发票数
    const unpaidResult = await dbGet(db, `
      SELECT COUNT(*) as count 
      FROM invoices 
      ${accountSetFilter ? accountSetFilter + ' AND' : 'WHERE'} (payment_status = 'unpaid' OR payment_status = 'partial')
    `, params);
    
    // 获取已付款发票数
    const paidResult = await dbGet(db, `
      SELECT COUNT(*) as count 
      FROM invoices 
      ${accountSetFilter ? accountSetFilter + ' AND' : 'WHERE'} payment_status = 'paid'
    `, params);
    
    // 获取总金额
    const amountResult = await dbGet(db, 
      `SELECT SUM(total_amount) as sum FROM invoices ${accountSetFilter}`, 
      params
    );
    
    res.json({
      total: totalResult ? totalResult.total : 0,
      unpaid: unpaidResult ? unpaidResult.count : 0,
      paid: paidResult ? paidResult.count : 0,
      totalAmount: amountResult && amountResult.sum ? amountResult.sum : 0
    });
  } catch (error) {
    console.error('获取发票统计失败:', error);
    res.status(500).json({ error: '获取发票统计失败' });
  } finally {
    try {
      db.close();
    } catch (dbError) {
      console.error('关闭数据库连接失败:', dbError);
    }
  }
});

// 获取单个发票详情
router.get('/:id', requireAuth, async (req, res) => {
  const db = getDb();
  
  try {
    const { id } = req.params;
    
    // 获取发票主表信息
    const invoice = await dbGet(db, `
      SELECT i.*, 
        c.name as customer_name, 
        c.address as customer_address,
        c.contact as customer_contact,
        c.phone as customer_phone,
        c.email as customer_email,
        s.name as salesperson_name,
        a.name as account_set_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN salespeople s ON i.salesperson_id = s.id
      LEFT JOIN account_sets a ON i.account_set_id = a.id
      WHERE i.id = ?
    `, [id]);
    
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }
    
    // 获取发票明细项
    const items = await dbQuery(db, `
      SELECT i.*, p.description as product_name, p.code as product_code
      FROM invoice_items i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.invoice_id = ?
      ORDER BY i.id
    `, [id]);
    
    // 获取付款记录
    const payments = await dbQuery(db, `
      SELECT * FROM invoice_payments
      WHERE invoice_id = ?
      ORDER BY payment_date DESC
    `, [id]);
    
    res.json({
      ...invoice,
      items,
      payments
    });
  } catch (error) {
    console.error('获取发票详情失败:', error);
    res.status(500).json({ error: '获取发票详情失败' });
  } finally {
    try {
      db.close();
    } catch (dbError) {
      console.error('关闭数据库连接失败:', dbError);
    }
  }
});

// 创建新发票
router.post('/', requireAuth, async (req, res) => {
  const {
    invoice_number,
    customer_id,
    account_set_id,
    salesperson_id,
    invoice_date,
    due_date,
    status,
    payment_method,
    payment_date,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    notes,
    items
  } = req.body;

  if (!customer_id || !account_set_id || !invoice_date || !items || !items.length) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const db = getDb();

  const MAX_RETRY = 3;
  let attempt = 0;
  let created = null;
  let lastError = null;

  try {
    while (attempt < MAX_RETRY && !created) {
      attempt++;
      try {
        await dbRun(db, 'BEGIN');

        const invoiceNumber = invoice_number && String(invoice_number).trim().length > 0
          ? String(invoice_number).trim()
          : await generateInvoiceNumber(account_set_id, invoice_date);

        const normalizedStatus = (status === 'published') ? 'issued' : (status || 'draft');

        const result = await dbRun(db, `
      INSERT INTO invoices (
        invoice_number, customer_id, account_set_id, salesperson_id, 
        invoice_date, due_date, status, payment_status, payment_method, 
        payment_date, subtotal, tax_amount, discount_amount, total_amount, 
        notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
          invoiceNumber, customer_id, account_set_id, salesperson_id,
          invoice_date, due_date, normalizedStatus,
          payment_date ? 'paid' : 'unpaid',
          payment_method, payment_date, subtotal, tax_amount,
          discount_amount, total_amount, notes,
          req.session.userId, req.session.userId
        ]);

        const invoiceId = result.lastID;

        // 处理明细：如需入库（issued/paid）则尽量补齐商品ID/编码
        const effectiveItems = [];
        for (const item of items) {
          let productId = item.product_id || null;
          let productCode = null;
          if ((normalizedStatus === 'issued' || normalizedStatus === 'paid') && !productId && item.description) {
            try {
              const p = await resolveOrCreateProduct(db, item.description, item.unit, item.unit_price, req.session.userId);
              if (p) {
                productId = p.id;
                productCode = p.code;
              }
            } catch (e) {
              console.warn('解析/创建商品失败，继续使用描述:', e?.message || e);
            }
          }
          effectiveItems.push({ ...item, product_id: productId, _product_code: productCode });

          await dbRun(db, `
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, unit_price,
          unit, tax_rate, tax_amount, discount_rate, discount_amount,
          subtotal, total, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            invoiceId, productId, item.description, item.quantity,
            item.unit_price, item.unit, item.tax_rate || 0,
            item.tax_amount || 0, item.discount_rate || 0,
            item.discount_amount || 0, item.subtotal, item.total,
            item.notes
          ]);
        }

        // 若发票保存为已开具(issued/paid)，将明细写入采购记录
        const isIssued = (normalizedStatus === 'issued' || normalizedStatus === 'paid');
        if (isIssued) {
          for (const item of effectiveItems) {
            await dbRun(db, `
              INSERT INTO purchase_records (
                account_set_id, invoice_id, record_date, product_id, product_code, product_description, unit, quantity, unit_price, created_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              account_set_id, invoiceId, invoice_date,
              item.product_id || null,
              item._product_code || null,
              item.description,
              item.unit || null,
              item.quantity || 0,
              item.unit_price || 0,
              req.session.userId
            ]);
          }
        }

        // 如果有付款信息，则添加付款记录
        if (payment_date && payment_method && total_amount > 0) {
          await dbRun(db, `
        INSERT INTO invoice_payments (
          invoice_id, payment_date, amount, payment_method,
          transaction_reference, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            invoiceId, payment_date, total_amount, payment_method,
            req.body.transaction_reference || null,
            '初始付款', req.session.userId
          ]);
        }

        await dbRun(db, 'COMMIT');
        created = { id: invoiceId, invoice_number: invoiceNumber };
      } catch (err) {
        await dbRun(db, 'ROLLBACK').catch(()=>{});
        lastError = err;
        const msg = String(err?.message || '');
        if (/UNIQUE constraint failed: invoices\.invoice_number/i.test(msg)) {
          if (attempt < MAX_RETRY) {
            continue;
          }
        }
        if (err && (err.code === 'no_rule_found' || err.code === 'invalid_rule_format')) {
          return res.status(400).json({ error: err.code === 'no_rule_found' ? 'no_rule_found' : 'invalid_rule_format', message: '账套未正确配置“发票编号”编码规则，请在账套中配置后重试' });
        }
        throw err;
      }
    }
    if (created) {
      return res.status(201).json({
        id: created.id,
        invoice_number: created.invoice_number,
        message: '发票创建成功'
      });
    }
    throw lastError || new Error('创建发票失败');
  } catch (error) {
    try { await dbRun(db, 'ROLLBACK'); } catch (e) {}
    console.error('创建发票失败:', error);
    res.status(500).json({ error: '创建发票失败' });
  } finally {
    try { db.close(); } catch (e) {}
  }
});

// 更新发票
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    customer_id, 
    account_set_id, 
    salesperson_id, 
    invoice_date, 
    due_date, 
    status,
    payment_status,
    payment_method, 
    payment_date,
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
    notes,
    items
  } = req.body;
  
  if (!customer_id || !account_set_id || !invoice_date) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const db = getDb();
  
  try {
    await dbRun(db, 'BEGIN');
    
    // 更新发票主表
    await dbRun(db, `
      UPDATE invoices SET
        customer_id = ?, 
        account_set_id = ?, 
        salesperson_id = ?, 
        invoice_date = ?, 
        due_date = ?, 
        status = ?, 
        payment_status = ?, 
        payment_method = ?, 
        payment_date = ?,
        subtotal = ?,
        tax_amount = ?,
        discount_amount = ?,
        total_amount = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
    `, [
      customer_id, account_set_id, salesperson_id,
      invoice_date, due_date, status, payment_status,
      payment_method, payment_date, subtotal, tax_amount, 
      discount_amount, total_amount, notes, 
      req.session.userId, id
    ]);
    
  // 如果提供了明细项，则先删除现有的，再添加新的
    if (items && items.length > 0) {
      // 删除现有明细项
  await dbRun(db, `DELETE FROM invoice_items WHERE invoice_id = ?`, [id]);
      
      // 添加新明细项（如需入库则尽量补齐商品ID/编码）
      const normalizedStatus = (status === 'published') ? 'issued' : (status || 'draft');
      const effectiveItems = [];
      for (const item of items) {
        let productId = item.product_id || null;
        let productCode = null;
        if ((normalizedStatus === 'issued' || normalizedStatus === 'paid') && !productId && item.description) {
          try {
            const p = await resolveOrCreateProduct(db, item.description, item.unit, item.unit_price, req.session.userId);
            if (p) {
              productId = p.id;
              productCode = p.code;
            }
          } catch(e) {
            console.warn('解析/创建商品失败(更新)：', e?.message || e);
          }
        }
        effectiveItems.push({ ...item, product_id: productId, _product_code: productCode });
        await dbRun(db, `
          INSERT INTO invoice_items (
            invoice_id, product_id, description, quantity, unit_price,
            unit, tax_rate, tax_amount, discount_rate, discount_amount,
            subtotal, total, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, productId, item.description, item.quantity,
          item.unit_price, item.unit, item.tax_rate || 0, 
          item.tax_amount || 0, item.discount_rate || 0,
          item.discount_amount || 0, item.subtotal, item.total,
          item.notes
        ]);
      }

      // 同步采购记录：先清除本发票相关记录，再视状态写入
      await dbRun(db, `DELETE FROM purchase_records WHERE invoice_id = ?`, [id]);
      const isIssued = (normalizedStatus === 'issued' || normalizedStatus === 'paid');
      if (isIssued) {
        for (const item of effectiveItems) {
          await dbRun(db, `
            INSERT INTO purchase_records (
              account_set_id, invoice_id, record_date, product_id, product_code, product_description, unit, quantity, unit_price, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            account_set_id, id, invoice_date,
            item.product_id || null,
            item._product_code || null,
            item.description,
            item.unit || null,
            item.quantity || 0,
            item.unit_price || 0,
            req.session.userId
          ]);
        }
      }
    }
    
    await dbRun(db, 'COMMIT');
    
    res.json({ message: '发票更新成功' });
  } catch (error) {
    try { await dbRun(db, 'ROLLBACK'); } catch (e) {}
    console.error('更新发票失败:', error);
    res.status(500).json({ error: '更新发票失败' });
  } finally {
    try { db.close(); } catch (e) {}
  }
});

// 删除发票
router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    // 检查发票是否存在
    const invoice = await dbGet(db, 'SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }
    // 仅允许删除草稿状态
    if (invoice.status !== 'draft') {
      return res.status(400).json({ error: '只能删除草稿状态的发票' });
    }
    await dbRun(db, 'DELETE FROM invoices WHERE id = ?', [id]);
    res.json({ message: '发票删除成功' });
  } catch (error) {
    console.error('删除发票失败:', error);
    res.status(500).json({ error: '删除发票失败' });
  } finally {
    try { db.close(); } catch (e) {}
  }
});

// 发票状态变更
router.put('/:id/status', requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: '缺少状态参数' });
    }
    // 允许的状态（与需求一致：已开具=issued、已作废=cancelled；保留 draft/paid/overdue 以兼容现有流程）
    const validStatuses = ['draft', 'issued', 'paid', 'cancelled', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }

    // 获取当前发票
    const invoice = await dbGet(db, 'SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }

    await dbRun(db, `
      UPDATE invoices SET
        status = ?,
        notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
    `, [status, notes ?? null, notes ?? null, req.session.userId, id]);

    // 同步采购记录：
    // 若状态变为 issued，则写入采购记录；若变为非 issued（如 cancelled/draft/paid），则移除相关记录
    const items = await dbQuery(db, `
      SELECT ii.*, inv.account_set_id, inv.invoice_date, p.code AS product_code
      FROM invoice_items ii
      JOIN invoices inv ON inv.id = ii.invoice_id
      LEFT JOIN products p ON p.id = ii.product_id
      WHERE ii.invoice_id = ?
    `, [id]);
    if (['issued','paid','overdue'].includes(status)) {
      // 先清理旧记录，后写入
      await dbRun(db, `DELETE FROM purchase_records WHERE invoice_id = ?`, [id]);
      for (const item of items) {
        await dbRun(db, `
          INSERT INTO purchase_records (
            account_set_id, invoice_id, record_date, product_id, product_code, product_description, unit, quantity, unit_price, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.account_set_id, id, item.invoice_date,
          item.product_id || null,
          item.product_code || null,
          item.description,
          item.unit || null,
          item.quantity || 0,
          item.unit_price || 0,
          req.session.userId
        ]);
      }
    } else { // draft 或 cancelled 时删除
      await dbRun(db, `DELETE FROM purchase_records WHERE invoice_id = ?`, [id]);
    }

    // 返回更新后简要信息
    const updated = await dbGet(db, 'SELECT status, updated_at, updated_by FROM invoices WHERE id = ?', [id]);
    res.json({ message: '发票状态更新成功', ...updated });
  } catch (error) {
    console.error('更新发票状态失败:', error);
    res.status(500).json({ error: '更新发票状态失败' });
  } finally {
    try { db.close(); } catch (e) {}
  }
});

// 发票付款
router.post('/:id/payments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { payment_date, amount, payment_method, transaction_reference, notes } = req.body;
  
  if (!payment_date || !amount || !payment_method) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const db = await db.getConnection();
  
  try {
    await db.beginTransaction();
    
    // 获取发票信息
    const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', id);
    
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }
    
    // 添加付款记录
    await db.run(`
      INSERT INTO invoice_payments (
        invoice_id, payment_date, amount, payment_method,
        transaction_reference, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, payment_date, amount, payment_method,
      transaction_reference || null,
      notes || null, req.user.id
    ]);
    
    // 获取所有付款记录总额
    const paymentResult = await db.get(`
      SELECT SUM(amount) as total_paid
      FROM invoice_payments
      WHERE invoice_id = ?
    `, id);
    
    const totalPaid = paymentResult ? paymentResult.total_paid : 0;
    
    // 确定付款状态
    let paymentStatus;
    if (totalPaid >= invoice.total_amount) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'unpaid';
    }
    
    // 更新发票状态
    await db.run(`
      UPDATE invoices SET
        payment_status = ?,
        status = CASE WHEN ? = 'paid' THEN 'paid' ELSE status END,
        payment_date = CASE WHEN ? = 'paid' THEN ? ELSE payment_date END,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
    `, [paymentStatus, paymentStatus, paymentStatus, payment_date, req.user.id, id]);
    
    await db.commit();
    
    res.status(201).json({
      message: '付款记录添加成功',
      payment_status: paymentStatus,
      total_paid: totalPaid
    });
  } catch (error) {
    await db.rollback();
    console.error('添加付款记录失败:', error);
    res.status(500).json({ error: '添加付款记录失败' });
  } finally {
    db.release();
  }
});

// 生成发票预览
router.post('/:id/preview', requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { template_id, paper_size } = req.body;
    
    if (!template_id) {
      return res.status(400).json({ error: '缺少模板ID' });
    }
    
    // 获取发票数据（包含客户、商品等关联信息）
    const invoice = await getInvoiceWithDetails(id);
    
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }
    
    // 获取打印模板（使用正确表名 print_templates）
    const template = await dbGet(db, `
      SELECT * FROM print_templates WHERE id = ?
    `, [template_id]);
    
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    // 获取账套资源（LOGO、公章、签名等）—从 account_sets 表读取 *_path 字段
    const resources = await dbGet(db, `
      SELECT 
        name AS company_name,
        code,
        address,
        phone,
        email,
        registration_number,
        tax_number,
        bank_name,
        bank_account,
        bank_name2,
        bank_account2,
        logo_path,
        seal_path,
        signature_path
      FROM account_sets WHERE id = ?
    `, [invoice.account_set_id]);
    
    // 生成HTML预览内容
    const html = await generateInvoiceHtml(invoice, template, resources, paper_size);
    
    res.json({ html });
  } catch (error) {
    console.error('生成预览失败:', error);
    res.status(500).json({ error: '生成预览失败' });
  } finally {
    try { db.close(); } catch (e) { console.error('关闭数据库连接失败:', e); }
  }
});

// 生成发票PDF
router.post('/:id/pdf', requireAuth, async (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { template_id, paper_size } = req.body;
    
    if (!template_id) {
      return res.status(400).json({ error: '缺少模板ID' });
    }
    
    // 获取发票数据（包含客户、商品等关联信息）
    const invoice = await getInvoiceWithDetails(id);
    
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }
    
    // 获取打印模板（使用正确表名 print_templates）
    const template = await dbGet(db, `
      SELECT * FROM print_templates WHERE id = ?
    `, [template_id]);
    
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    // 获取账套资源（LOGO、公章、签名等）—从 account_sets 表读取 *_path 字段
    const resources = await dbGet(db, `
      SELECT 
        name AS company_name,
        code,
        address,
        phone,
        email,
        registration_number,
        tax_number,
        bank_name,
        bank_account,
        bank_name2,
        bank_account2,
        logo_path,
        seal_path,
        signature_path
      FROM account_sets WHERE id = ?
    `, [invoice.account_set_id]);
    
    // 生成HTML预览内容
    const html = await generateInvoiceHtml(invoice, template, resources, paper_size);
    
    // 生成PDF
    const pdfBuffer = await generatePDF(html, {
      format: paper_size || 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
    
    // 发送PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('生成PDF失败:', error);
    res.status(500).json({ error: '生成PDF失败' });
  } finally {
    try { db.close(); } catch (e) { console.error('关闭数据库连接失败:', e); }
  }
});

// 辅助函数：获取带详细信息的发票
async function getInvoiceWithDetails(id) {
  const db = getDb();
  try {
    // 获取发票主表信息
    const invoice = await dbGet(db, `
      SELECT i.*, 
        c.name as customer_name, 
        c.address as customer_address,
        c.contact as customer_contact,
        c.email as customer_email,
        c.phone as customer_phone,
        s.name as salesperson_name,
        a.name as account_set_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN salespeople s ON i.salesperson_id = s.id
      LEFT JOIN account_sets a ON i.account_set_id = a.id
      WHERE i.id = ?
    `, [id]);
    
    if (!invoice) {
      return null;
    }
    
    // 获取发票明细项
    const items = await dbQuery(db, `
      SELECT i.*, p.description as product_name, p.code as product_code
      FROM invoice_items i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.invoice_id = ?
      ORDER BY i.id
    `, [id]);
    
    // 获取付款记录
    const payments = await dbQuery(db, `
      SELECT * FROM invoice_payments
      WHERE invoice_id = ?
      ORDER BY payment_date DESC
    `, [id]);
    
    return {
      ...invoice,
      items,
      payments
    };
  } catch (error) {
    console.error('获取发票详情失败:', error);
    return null;
  } finally {
    try {
      db.close();
    } catch (dbError) {
      console.error('关闭数据库连接失败:', dbError);
    }
  }
}

// 辅助函数：生成发票HTML
async function generateInvoiceHtml(invoice, template, resources, paperSize) {
  // 这里将使用模板和资源生成发票HTML
  // 实际项目中可能会使用模板引擎如Handlebars、EJS等
  
  // 账套资源：使用 account_sets 表中的 *_path 字段
  const logo = resources?.logo_path || '';
  const seal = resources?.seal_path || '';
  const signature = resources?.signature_path || '';
  
  // 使用模板内容替换变量
  let html = template.content;
  
  // 替换发票基本信息
  const n2 = (v) => Number.isFinite(parseFloat(v)) ? parseFloat(v).toFixed(2) : '0.00';
  // 计算已付与未付金额（基于付款记录）
  const paid = (invoice.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = Math.max(0, (parseFloat(invoice.total_amount) || 0) - paid);
  html = html.replace(/\{\{invoice_number\}\}/g, invoice.invoice_number || '')
             .replace(/\{\{invoice_date\}\}/g, invoice.invoice_date || '')
             .replace(/\{\{due_date\}\}/g, invoice.due_date || '')
             .replace(/\{\{status\}\}/g, invoice.status || '')
             .replace(/\{\{invoice_status\}\}/g, invoice.status || '')
             .replace(/\{\{payment_status\}\}/g, invoice.payment_status || '')
             .replace(/\{\{subtotal\}\}/g, n2(invoice.subtotal))
             .replace(/\{\{tax_amount\}\}/g, n2(invoice.tax_amount))
             .replace(/\{\{discount_amount\}\}/g, n2(invoice.discount_amount))
             .replace(/\{\{total_amount\}\}/g, n2(invoice.total_amount))
             .replace(/\{\{paid_amount\}\}/g, n2(paid))
             .replace(/\{\{remaining_amount\}\}/g, n2(remaining))
             .replace(/\{\{notes\}\}/g, invoice.notes || '')
             .replace(/\{\{invoice_notes\}\}/g, invoice.notes || '')
             .replace(/\{\{payment_method\}\}/g, invoice.payment_method || '');
  
  // 替换客户信息
  html = html.replace(/\{\{customer_name\}\}/g, invoice.customer_name || '')
             .replace(/\{\{customer_address\}\}/g, invoice.customer_address || '')
             .replace(/\{\{customer_contact\}\}/g, invoice.customer_contact || '')
             .replace(/\{\{customer_phone\}\}/g, invoice.customer_phone || '')
             .replace(/\{\{customer_email\}\}/g, invoice.customer_email || '');
  
  // 替换账套和业务员信息
  html = html.replace(/\{\{account_set_name\}\}/g, invoice.account_set_name || '')
             .replace(/\{\{salesperson_name\}\}/g, invoice.salesperson_name || '');
  // 账套公司信息（尽量从 account_sets 读取，需要额外查询时已在外部传入 resources，可扩展为附带文本字段）
  // 兼容多个占位符别名：company_* 与 account_set_*
  const acct = resources || {};
  const replaceMap = {
    company_name: acct.company_name || invoice.account_set_name || '',
    company_code: acct.code || '',
    company_address: acct.address || '',
    company_phone: acct.phone || '',
    company_email: acct.email || '',
    registration_number: acct.registration_number || '',
    tax_number: acct.tax_number || '',
    bank_name: acct.bank_name || '',
    bank_account: acct.bank_account || '',
    bank_name2: acct.bank_name2 || '',
    bank_account2: acct.bank_account2 || ''
  };
  Object.entries(replaceMap).forEach(([k,v]) => {
    html = html.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || '');
  });
  // 兼容 account_set_* 前缀
  html = html.replace(/\{\{account_set_name\}\}/g, replaceMap.company_name || invoice.account_set_name || '')
             .replace(/\{\{account_set_code\}\}/g, replaceMap.company_code || '')
             .replace(/\{\{account_set_address\}\}/g, replaceMap.company_address || '')
             .replace(/\{\{account_set_phone\}\}/g, replaceMap.company_phone || '')
             .replace(/\{\{account_set_email\}\}/g, replaceMap.company_email || '')
             .replace(/\{\{registration_no\}\}/g, replaceMap.registration_number || '')
             .replace(/\{\{tax_id\}\}/g, replaceMap.tax_number || '');
  
  // 替换资源路径
  const norm = (p) => p || '';
  html = html.replace(/\{\{logo\}\}/g, norm(logo))
             .replace(/\{\{seal\}\}/g, norm(seal))
             .replace(/\{\{signature\}\}/g, norm(signature))
             // 兼容旧别名
             .replace(/\{\{company_logo\}\}/g, norm(logo))
             .replace(/\{\{company_seal\}\}/g, norm(seal));
  
  // 生成明细项HTML
  let itemsHtml = '';
  (invoice.items || []).forEach((item, index) => {
    itemsHtml += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.product_name || ''}</td>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.unit || ''}</td>
        <td>${n2(item.unit_price)}</td>
        <td>${Number.isFinite(parseFloat(item.tax_rate)) ? (parseFloat(item.tax_rate).toFixed(2) + '%') : '0%'}</td>
        <td>${Number.isFinite(parseFloat(item.discount_rate)) ? (parseFloat(item.discount_rate).toFixed(2) + '%') : '0%'}</td>
        <td>${n2(item.amount || item.total)}</td>
      </tr>
    `;
  });
  
  // 替换明细项占位符
  html = html.replace(/\{\{invoice_items\}\}/g, itemsHtml);
  
  // 根据纸张大小调整CSS
  const pageSizeStyles = {
    'A4': {
      width: '210mm',
      height: '297mm',
    },
    'A5': {
      width: '148mm',
      height: '210mm',
    },
    'B5': {
      width: '176mm',
      height: '250mm',
    }
  };
  
  const size = pageSizeStyles[paperSize] || pageSizeStyles.A4;
  
  // 添加页面大小样式
  html = html.replace('</head>', `
    <style>
      @page {
        size: ${size.width} ${size.height};
        margin: 0;
      }
      body {
        width: ${size.width};
        max-width: ${size.width};
        min-height: ${size.height};
      }
    </style>
    </head>
  `);
  
  return html;
}

// （已上移到 '/:id' 之前）

export default router;