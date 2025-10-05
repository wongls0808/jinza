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
export async function generateInvoiceNumber(accountSetId, issueDate) {
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

    // 使用开票日期（issueDate）作为时间基准；如果未提供则使用当前时间
    const baseDate = (() => {
      try {
        if (issueDate) {
          const d = new Date(issueDate);
          if (!isNaN(d.getTime())) return d;
        }
      } catch (_) {}
      return new Date();
    })();

    const yyyy = baseDate.getFullYear().toString();
    const yy = yyyy.slice(-2);
    const mm = (baseDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = baseDate.getDate().toString().padStart(2, '0');
    const HH = baseDate.getHours().toString().padStart(2, '0');
    const MM = baseDate.getMinutes().toString().padStart(2, '0');

    // 支持两类占位：大括号风格 {year}/{month}/{day} 与格式化风格 YYYY/YY/MM/DD
    let fmt = String(rule.format || '').trim();
    if (!fmt) {
      const err = new Error('invalid_rule_format');
      err.code = 'invalid_rule_format';
      throw err;
    }

    // 先替换大括号占位
    fmt = fmt
      .replace('{prefix}', rule.prefix || '')
      .replace('{suffix}', rule.suffix || '')
      .replace('{year}', yyyy)
      .replace('{month}', mm)
      .replace('{day}', dd)
      .replace('{hour}', HH)
      .replace('{minute}', MM);

    // 再替换格式化占位
    fmt = fmt
      .replace(/YYYY/g, yyyy)
      .replace(/YY/g, yy)
      .replace(/MM/g, mm)
      .replace(/DD/g, dd);

    // 确定数字占位及宽度：优先识别连续的0作为序列宽度，否则识别 {number}，默认宽度4
    let width = 4;
    let placeholderStart = -1;
    let placeholderEnd = -1;
    const zeroRunMatch = fmt.match(/0{2,}/); // 至少两个零代表占位
    if (zeroRunMatch) {
      width = zeroRunMatch[0].length;
      placeholderStart = zeroRunMatch.index;
      placeholderEnd = placeholderStart + width;
    } else {
      const numberIdx = fmt.indexOf('{number}');
      if (numberIdx !== -1) {
        placeholderStart = numberIdx;
        placeholderEnd = numberIdx + '{number}'.length;
      } else {
        // 如果既没有零占位，也没有{number}，则默认追加一个零占位
        fmt = fmt + '0'.repeat(width);
        const m2 = fmt.match(/0{2,}$/);
        width = m2 ? m2[0].length : width;
        placeholderStart = fmt.length - width;
        placeholderEnd = fmt.length;
      }
    }

    const prefix = fmt.slice(0, placeholderStart);
    const suffix = fmt.slice(placeholderEnd);

    // 查找相同前后缀的最后一条发票编号（限定在该账套下）
    const likePattern = prefix + '%' + suffix;
    const last = await getOne(
      `SELECT invoice_number FROM invoices 
       WHERE account_set_id = ? AND invoice_number LIKE ?
       ORDER BY invoice_number DESC LIMIT 1`,
      [accountSetId, likePattern]
    );

    let nextSeq = 1;
    if (last && last.invoice_number) {
      const numPart = last.invoice_number.substring(prefix.length, prefix.length + width);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed)) nextSeq = parsed + 1;
    }

    const code = prefix + String(nextSeq).padStart(width, '0') + suffix;
    return code;
  } catch (error) {
    // 将错误抛给调用方处理（用于给前端明确提示）
    throw error;
  } finally {
    try { db.close(); } catch (e) {}
  }
}