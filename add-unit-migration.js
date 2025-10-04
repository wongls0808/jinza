/**
 * 数据库迁移脚本 - 添加products表的unit字段
 */
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'data', 'app.db'));

console.log('开始执行数据库迁移: 向products表添加unit字段...');

db.run(`ALTER TABLE products ADD COLUMN unit TEXT DEFAULT ''`, (err) => {
  if (err) {
    console.error('迁移失败:', err.message);
    // 如果错误是因为列已存在，这是可以接受的
    if (err.message.includes('duplicate column name')) {
      console.log('unit字段已经存在，迁移跳过');
    }
  } else {
    console.log('迁移成功: 向products表添加了unit字段');
  }
  
  db.close(() => {
    console.log('数据库连接已关闭');
  });
});