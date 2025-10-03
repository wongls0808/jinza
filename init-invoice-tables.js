import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

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

// 读取SQL文件
const sqlPath = join(__dirname, 'data', 'migrations', 'invoices_schema.sql');
console.log('读取SQL文件:', sqlPath);

try {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('成功读取SQL文件');
  
  // 执行SQL语句
  console.log('正在执行SQL...');
  db.exec(sql, (err) => {
    if (err) {
      console.error('执行SQL失败:', err);
    } else {
      console.log('成功创建发票相关表');
      
      // 验证表是否创建成功
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'invoice%'", (err, tables) => {
        if (err) {
          console.error('验证表创建失败:', err);
        } else {
          console.log('已创建的发票相关表:', tables);
        }
        db.close();
      });
    }
  });
} catch (error) {
  console.error('读取SQL文件失败:', error);
  db.close();
}