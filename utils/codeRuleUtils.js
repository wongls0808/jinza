/**
 * 发票编号生成工具（与 /api/generate-code 保持一致的实现）
 */
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取数据库连接
function getDb() {
  const dataDir = process.env.DATA_DIR ? process.env.DATA_DIR : join(__dirname, '../data');
  const dbPath = join(dataDir, 'app.db');
  return new sqlite3.Database(dbPath);
}

/**
 * 根据账套ID生成发票编号
 * 规则来源：code_rules + invoice_code_rules；使用 code_rules.format 与 current_number
 * 可用占位：{prefix} {suffix} {number} {year} {month} {day} {hour} {minute}
 * {number} 默认左填充4位
 */
export async function generateInvoiceNumber(accountSetId) {
  const db = getDb();
  try {
    const getOne = (sql, params=[]) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
    const run = (sql, params=[]) => new Promise((resolve, reject) => {
      db.run(sql, params, function(err){ err ? reject(err) : resolve(this); });
    });

    // 读取当前账套中名称为“发票编号”的编码规则
    const rule = await getOne(
      `SELECT * FROM code_rules WHERE account_set_id = ? AND name = ? LIMIT 1`,
      [accountSetId, '发票编号']
    );

    if (!rule) {
      const err = new Error('no_rule_found');
      err.code = 'no_rule_found';
      throw err;
    }
    if (!rule.format || typeof rule.format !== 'string' || rule.format.trim() === '') {
      const err = new Error('invalid_rule_format');
      err.code = 'invalid_rule_format';
      throw err;
    }

    // 原子地将 current_number + 1 后生成编码
    const newNumber = (parseInt(rule.current_number || 0, 10) || 0) + 1;
    await run(`UPDATE code_rules SET current_number = ? WHERE id = ?`, [newNumber, rule.id]);

    // 生成编码，沿用 /api/generate-code 的占位规则
    let generatedCode = (rule.format)
      .replace('{prefix}', rule.prefix || '')
      .replace('{suffix}', rule.suffix || '')
      .replace('{number}', String(newNumber).padStart(4, '0'))
      .replace('{year}', new Date().getFullYear().toString())
      .replace('{month}', (new Date().getMonth() + 1).toString().padStart(2, '0'))
      .replace('{day}', new Date().getDate().toString().padStart(2, '0'))
      .replace('{hour}', new Date().getHours().toString().padStart(2, '0'))
      .replace('{minute}', new Date().getMinutes().toString().padStart(2, '0'));

    return generatedCode;
  } catch (error) {
    // 将错误抛给调用方处理（用于给前端明确提示）
    throw error;
  } finally {
    try { db.close(); } catch (e) {}
  }
}