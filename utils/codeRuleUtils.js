/**
 * 发票编号生成工具
 */
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 数据库连接
const dataDir = process.env.DATA_DIR ? process.env.DATA_DIR : join(__dirname, '../data');
const db = new sqlite3.Database(join(dataDir, 'app.db'));

/**
 * 根据账套ID生成发票编号
 * @param {number} accountSetId 账套ID
 * @returns {Promise<string>} 生成的发票编号
 */
export async function generateInvoiceNumber(accountSetId) {
  try {
    // 查找该账套下的默认编号规则
    let codeRule = await db.get(`
      SELECT cr.*
      FROM invoice_code_rules icr
      JOIN code_rules cr ON icr.code_rule_id = cr.id
      WHERE icr.account_set_id = ? AND icr.is_default = 1
    `, accountSetId);
    
    // 如果没有默认规则，选择第一个规则
    if (!codeRule) {
      codeRule = await db.get(`
        SELECT cr.*
        FROM invoice_code_rules icr
        JOIN code_rules cr ON icr.code_rule_id = cr.id
        WHERE icr.account_set_id = ?
        LIMIT 1
      `, accountSetId);
    }
    
    // 如果仍找不到规则，使用系统默认规则
    if (!codeRule) {
      codeRule = {
        prefix: 'INV',
        date_format: 'YYYYMMDD',
        separator: '-',
        sequence_length: 4,
        sequence_start: 1,
        sequence_current: 0
      };
    }
    
    // 解析规则
    const { prefix, date_format, separator, sequence_length, sequence_current } = codeRule;
    
    // 生成日期部分
    let dateStr = '';
    const now = new Date();
    
    switch (date_format) {
      case 'YYYYMMDD':
        dateStr = now.getFullYear() +
                 String(now.getMonth() + 1).padStart(2, '0') +
                 String(now.getDate()).padStart(2, '0');
        break;
      case 'YYYYMM':
        dateStr = now.getFullYear() +
                 String(now.getMonth() + 1).padStart(2, '0');
        break;
      case 'YYYY':
        dateStr = String(now.getFullYear());
        break;
      default:
        dateStr = now.getFullYear() +
                 String(now.getMonth() + 1).padStart(2, '0') +
                 String(now.getDate()).padStart(2, '0');
    }
    
    // 生成序列号部分
    let sequenceNumber = sequence_current + 1;
    
    // 更新当前序列号
    if (codeRule.id) {
      await db.run(`
        UPDATE code_rules
        SET sequence_current = ?
        WHERE id = ?
      `, [sequenceNumber, codeRule.id]);
    }
    
    // 格式化序列号
    const sequenceStr = String(sequenceNumber).padStart(sequence_length, '0');
    
    // 组合生成编号
    const invoiceNumber = [prefix, dateStr, sequenceStr].filter(Boolean).join(separator);
    
    return invoiceNumber;
  } catch (error) {
    console.error('生成发票编号失败:', error);
    // 如果出错，使用时间戳作为回退方案
    const timestamp = Date.now();
    return `INV-${timestamp}`;
  }
}

// ES模块导出已在函数声明处完成