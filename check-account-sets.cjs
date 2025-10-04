const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/app.db');

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