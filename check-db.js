import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建数据库连接
const dbPath = join(__dirname, 'data', 'app.db');
console.log('连接到数据库:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err);
    process.exit(1);
  }
});

// 列出所有表
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('获取表列表失败:', err);
  } else {
    console.log('数据库中的表:');
    console.log(tables);
  }
  
  // 检查发票表是否存在
  const invoiceTable = tables.find(t => t.name === 'invoices');
  if (invoiceTable) {
    console.log('发票表存在，正在检查记录...');
    db.all("SELECT COUNT(*) as count FROM invoices", (err, result) => {
      if (err) {
        console.error('检查发票表记录失败:', err);
      } else {
        console.log('发票表记录数:', result[0].count);
        
        if (result[0].count > 0) {
          // 抽样检查几条记录
          db.all("SELECT * FROM invoices LIMIT 3", (err, rows) => {
            if (err) {
              console.error('读取发票记录失败:', err);
            } else {
              console.log('发票记录示例:', JSON.stringify(rows, null, 2));
            }
            db.close();
          });
        } else {
          console.log('发票表中没有记录');
          db.close();
        }
      }
    });
  } else {
    console.error('错误: 发票表不存在!');
    db.close();
  }
});