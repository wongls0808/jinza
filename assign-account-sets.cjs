const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/app.db');

function assignForUser(userId, accountSets, cb) {
  db.all('SELECT * FROM user_account_sets WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return cb(err);

    if (rows.length === 0) {
      // 为该用户分配所有账套，并把第一套设为默认
      const firstSetId = accountSets[0]?.id;
      let pending = accountSets.length;
      if (pending === 0) return cb();

      accountSets.forEach((set, idx) => {
        db.run(
          'INSERT OR IGNORE INTO user_account_sets (user_id, account_set_id, is_default) VALUES (?, ?, ?)',
          [userId, set.id, idx === 0 ? 1 : 0],
          (err2) => {
            if (err2) console.error(`用户${userId} -> 账套${set.id} 关联失败:`, err2.message);
            if (--pending === 0) cb();
          }
        );
      });
    } else {
      // 如果已经有关联，但没有默认账套，则将第一条设为默认
      const hasDefault = rows.some(r => r.is_default === 1);
      if (!hasDefault && rows.length > 0) {
        db.run('UPDATE user_account_sets SET is_default = 0 WHERE user_id = ?', [userId], (err3) => {
          if (err3) return cb(err3);
          db.run('UPDATE user_account_sets SET is_default = 1 WHERE id = ?', [rows[0].id], (err4) => cb(err4));
        });
      } else {
        cb();
      }
    }
  });
}

function main() {
  db.all('SELECT * FROM account_sets WHERE is_active = 1 ORDER BY id ASC', [], (err, sets) => {
    if (err) {
      console.error('读取账套失败:', err);
      return db.close();
    }
    if (sets.length === 0) {
      console.log('没有可用账套，退出');
      return db.close();
    }

    db.all('SELECT id, username, name FROM users WHERE is_active = 1', [], (err2, users) => {
      if (err2) {
        console.error('读取用户失败:', err2);
        return db.close();
      }
      if (users.length === 0) {
        console.log('没有用户');
        return db.close();
      }

      console.log(`为 ${users.length} 个用户检查并分配账套`);
      let idx = 0;
      function next() {
        if (idx >= users.length) {
          console.log('处理完成');
          return db.close();
        }
        const u = users[idx++];
        console.log(`处理用户 ${u.id} (${u.username}/${u.name})`);
        assignForUser(u.id, sets, (errx) => {
          if (errx) console.error(`用户${u.id} 处理出错:`, errx);
          next();
        });
      }
      next();
    });
  });
}

main();