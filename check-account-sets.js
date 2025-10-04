import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SQLite3 = sqlite3.verbose();

const db = new SQLite3.Database(join(__dirname, './data/app.db'));

// 检查账套表
db.all(`SELECT * FROM account_sets`, [], (err, accountSets) => {
  if (err) {
    console.error('查询账套表失败:', err);
  } else {
    console.log('账套表数据:');
    console.log(accountSets);
  }

  // 检查用户账套关联表
  db.all(`SELECT * FROM user_account_sets`, [], (err, userAccountSets) => {
    if (err) {
      console.error('查询用户账套关联表失败:', err);
    } else {
      console.log('用户账套关联表数据:');
      console.log(userAccountSets);
    }

    // 关闭数据库连接
    db.close();
  });
});