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

// 获取所有发票
router.get('/', async (req, res) => {
  const db = getDb();
  
  try {
    let query = `
      SELECT i.*, 
        c.name as customer_name, 
        s.name as salesperson_name,
        a.name as account_set_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN salespeople s ON i.salesperson_id = s.id
      LEFT JOIN account_sets a ON i.account_set_id = a.id
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
      const offset = parseInt(req.query.offset) || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }
    
    const invoices = await dbQuery(db, query, params);
    
    // 获取总数
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    
    // 应用相同的过滤条件
    let totalParams = [];
    if (req.query.customer_id) {
      totalParams.push(req.query.customer_id);
    }
    
    if (req.query.account_set_id) {
      totalParams.push(req.query.account_set_id);
    }
    
    if (req.query.salesperson_id) {
      totalParams.push(req.query.salesperson_id);
    }
    
    if (req.query.status) {
      totalParams.push(req.query.status);
    }
    
    if (req.query.payment_status) {
      totalParams.push(req.query.payment_status);
    }
    
    if (req.query.start_date && req.query.end_date) {
      totalParams.push(req.query.start_date, req.query.end_date);
    }
    
    if (req.query.search) {
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

// 获取单个发票详情
router.get('/:id(\\d+)', requireAuth, async (req, res) => {
  const db = getDb();
  
  try {
    const { id } = req.params;
    
    // 获取发票主表信息
    const invoice = await dbGet(db, `
      SELECT i.*, 
        c.name as customer_name, 
        c.address as customer_address,
        c.contact_person as customer_contact,
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
      return res.status(404).json({ error: '发票不存在' });
    }
    
    // 获取发票明细项
    const items = await dbQuery(db, `
      SELECT i.*, p.name as product_name, p.sku as product_sku
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
  
  const db = await db.getConnection();
  
  try {
    await db.beginTransaction();
    
    // 生成发票编号
    const invoiceNumber = await generateInvoiceNumber(account_set_id);
    
    // 插入发票主表
    const result = await db.run(`
      INSERT INTO invoices (
        invoice_number, customer_id, account_set_id, salesperson_id, 
        invoice_date, due_date, status, payment_status, payment_method, 
        payment_date, subtotal, tax_amount, discount_amount, total_amount, 
        notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNumber, customer_id, account_set_id, salesperson_id,
      invoice_date, due_date, status || 'draft', 
      payment_date ? 'paid' : 'unpaid',
      payment_method, payment_date, subtotal, tax_amount, 
      discount_amount, total_amount, notes, 
      req.user.id, req.user.id
    ]);
    
    const invoiceId = result.lastID;
    
    // 插入发票明细项
    for (const item of items) {
      await db.run(`
        INSERT INTO invoice_items (
          invoice_id, product_id, description, quantity, unit_price,
          unit, tax_rate, tax_amount, discount_rate, discount_amount,
          subtotal, total, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceId, item.product_id, item.description, item.quantity,
        item.unit_price, item.unit, item.tax_rate || 0, 
        item.tax_amount || 0, item.discount_rate || 0,
        item.discount_amount || 0, item.subtotal, item.total,
        item.notes
      ]);
    }
    
    // 如果有付款信息，则添加付款记录
    if (payment_date && payment_method && total_amount > 0) {
      await db.run(`
        INSERT INTO invoice_payments (
          invoice_id, payment_date, amount, payment_method,
          transaction_reference, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceId, payment_date, total_amount, payment_method,
        req.body.transaction_reference || null,
        '初始付款', req.user.id
      ]);
    }
    
    await db.commit();
    
    res.status(201).json({
      id: invoiceId,
      invoice_number: invoiceNumber,
      message: '发票创建成功'
    });
  } catch (error) {
    await db.rollback();
    console.error('创建发票失败:', error);
    res.status(500).json({ error: '创建发票失败' });
  } finally {
    db.release();
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
  
  const db = await db.getConnection();
  
  try {
    await db.beginTransaction();
    
    // 更新发票主表
    await db.run(`
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
      req.user.id, id
    ]);
    
    // 如果提供了明细项，则先删除现有的，再添加新的
    if (items && items.length > 0) {
      // 删除现有明细项
      await db.run(`DELETE FROM invoice_items WHERE invoice_id = ?`, id);
      
      // 添加新明细项
      for (const item of items) {
        await db.run(`
          INSERT INTO invoice_items (
            invoice_id, product_id, description, quantity, unit_price,
            unit, tax_rate, tax_amount, discount_rate, discount_amount,
            subtotal, total, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, item.product_id, item.description, item.quantity,
          item.unit_price, item.unit, item.tax_rate || 0, 
          item.tax_amount || 0, item.discount_rate || 0,
          item.discount_amount || 0, item.subtotal, item.total,
          item.notes
        ]);
      }
    }
    
    await db.commit();
    
    res.json({ message: '发票更新成功' });
  } catch (error) {
    await db.rollback();
    console.error('更新发票失败:', error);
    res.status(500).json({ error: '更新发票失败' });
  } finally {
    db.release();
  }
});

// 删除发票
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查发票是否存在
    const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', id);
    
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }
    
    // 检查发票状态，只能删除草稿状态的发票
    if (invoice.status !== 'draft') {
      return res.status(400).json({ error: '只能删除草稿状态的发票' });
    }
    
    // 删除发票及其关联的明细项（依赖外键级联删除）
    await db.run('DELETE FROM invoices WHERE id = ?', id);
    
    res.json({ message: '发票删除成功' });
  } catch (error) {
    console.error('删除发票失败:', error);
    res.status(500).json({ error: '删除发票失败' });
  }
});

// 发票状态变更
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: '缺少状态参数' });
    }
    
    // 验证状态值
    const validStatuses = ['draft', 'issued', 'paid', 'cancelled', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的状态值' });
    }
    
    // 获取当前发票
    const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', id);
    
    if (!invoice) {
      return res.status(404).json({ error: '发票不存在' });
    }
    
    // 更新状态
    await db.run(`
      UPDATE invoices SET
        status = ?,
        notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ?
      WHERE id = ?
    `, [status, notes, notes, req.user.id, id]);
    
    res.json({ message: '发票状态更新成功' });
  } catch (error) {
    console.error('更新发票状态失败:', error);
    res.status(500).json({ error: '更新发票状态失败' });
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
    
    // 获取打印模板
    const template = await db.get(`
      SELECT * FROM templates WHERE id = ?
    `, template_id);
    
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    // 获取账套资源（LOGO、公章、签名等）
    const resources = await db.all(`
      SELECT * FROM account_set_resources
      WHERE account_set_id = ?
    `, invoice.account_set_id);
    
    // 生成HTML预览内容
    const html = await generateInvoiceHtml(invoice, template, resources, paper_size);
    
    res.json({ html });
  } catch (error) {
    console.error('生成预览失败:', error);
    res.status(500).json({ error: '生成预览失败' });
  }
});

// 生成发票PDF
router.post('/:id/pdf', requireAuth, async (req, res) => {
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
    
    // 获取打印模板
    const template = await db.get(`
      SELECT * FROM templates WHERE id = ?
    `, template_id);
    
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    
    // 获取账套资源（LOGO、公章、签名等）
    const resources = await db.all(`
      SELECT * FROM account_set_resources
      WHERE account_set_id = ?
    `, invoice.account_set_id);
    
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
        c.contact_person as customer_contact,
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
      SELECT i.*, p.name as product_name, p.sku as product_sku
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
  
  // 查找LOGO、公章、签名等资源
  const logo = resources.find(r => r.type === 'logo')?.path || '';
  const seal = resources.find(r => r.type === 'seal')?.path || '';
  const signature = resources.find(r => r.type === 'signature')?.path || '';
  
  // 使用模板内容替换变量
  let html = template.content;
  
  // 替换发票基本信息
  html = html.replace(/\{\{invoice_number\}\}/g, invoice.invoice_number)
             .replace(/\{\{invoice_date\}\}/g, invoice.invoice_date)
             .replace(/\{\{due_date\}\}/g, invoice.due_date || '')
             .replace(/\{\{status\}\}/g, invoice.status)
             .replace(/\{\{payment_status\}\}/g, invoice.payment_status)
             .replace(/\{\{subtotal\}\}/g, invoice.subtotal.toFixed(2))
             .replace(/\{\{tax_amount\}\}/g, invoice.tax_amount.toFixed(2))
             .replace(/\{\{discount_amount\}\}/g, invoice.discount_amount.toFixed(2))
             .replace(/\{\{total_amount\}\}/g, invoice.total_amount.toFixed(2));
  
  // 替换客户信息
  html = html.replace(/\{\{customer_name\}\}/g, invoice.customer_name || '')
             .replace(/\{\{customer_address\}\}/g, invoice.customer_address || '')
             .replace(/\{\{customer_contact\}\}/g, invoice.customer_contact || '')
             .replace(/\{\{customer_phone\}\}/g, invoice.customer_phone || '');
  
  // 替换账套和业务员信息
  html = html.replace(/\{\{account_set_name\}\}/g, invoice.account_set_name || '')
             .replace(/\{\{salesperson_name\}\}/g, invoice.salesperson_name || '');
  
  // 替换资源路径
  html = html.replace(/\{\{logo\}\}/g, logo ? `/uploads/${logo}` : '')
             .replace(/\{\{seal\}\}/g, seal ? `/uploads/${seal}` : '')
             .replace(/\{\{signature\}\}/g, signature ? `/uploads/${signature}` : '');
  
  // 生成明细项HTML
  let itemsHtml = '';
  invoice.items.forEach((item, index) => {
    itemsHtml += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.product_name || ''}</td>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.unit || ''}</td>
        <td>${item.unit_price.toFixed(2)}</td>
        <td>${item.tax_rate ? (item.tax_rate * 100).toFixed(2) + '%' : '0%'}</td>
        <td>${item.discount_rate ? (item.discount_rate * 100).toFixed(2) + '%' : '0%'}</td>
        <td>${item.total.toFixed(2)}</td>
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

// 获取发票统计数据
router.get('/stats', async (req, res) => {
  const db = getDb();
  
  try {
    // 获取总发票数
    const totalResult = await dbGet(db, `SELECT COUNT(*) as total FROM invoices`);
    
    // 获取未付款发票数
    const unpaidResult = await dbGet(db, `
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE payment_status = 'unpaid' OR payment_status = 'partial'
    `);
    
    // 获取已付款发票数
    const paidResult = await dbGet(db, `
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE payment_status = 'paid'
    `);
    
    // 获取总金额
    const amountResult = await dbGet(db, `SELECT SUM(total_amount) as sum FROM invoices`);
    
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

export default router;