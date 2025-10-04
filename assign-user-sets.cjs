const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/app.db');

function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, username, name FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function getSetsByNames(names) {
  const placeholders = names.map(() => '?').join(',');
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, name FROM account_sets WHERE name IN (${placeholders})`, names, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function ensureUserSets(userId, setIds, defaultSetId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 先插入关联（忽略已存在）
      const stmt = db.prepare('INSERT OR IGNORE INTO user_account_sets (user_id, account_set_id, is_default) VALUES (?, ?, 0)');
      setIds.forEach(id => stmt.run(userId, id));
      stmt.finalize((e) => {
        if (e) return reject(e);
        // 重置默认，再设置默认
        db.run('UPDATE user_account_sets SET is_default = 0 WHERE user_id = ?', [userId], (e2) => {
          if (e2) return reject(e2);
          db.run('UPDATE user_account_sets SET is_default = 1 WHERE user_id = ? AND account_set_id = ?', [userId, defaultSetId], (e3) => {
            if (e3) return reject(e3);
            resolve();
          });
        });
      });
    });
  });
}

async function main() {
  const username = process.argv[2] || 'leo';
  const defaultSetName = process.argv[3] || 'FIRST BEST';
  const otherSetName = process.argv[4] || 'BESTRADE';

  try {
    const user = await getUserByUsername(username);
    if (!user) {
      console.error('未找到用户:', username);
      return db.close();
    }
    console.log('目标用户:', user);

    const sets = await getSetsByNames([defaultSetName, otherSetName]);
    if (!sets || sets.length === 0) {
      console.error('未找到指定账套:', defaultSetName, otherSetName);
      return db.close();
    }

    const map = Object.fromEntries(sets.map(s => [s.name, s.id]));
    const defaultSetId = map[defaultSetName];
    const otherSetId = map[otherSetName];
    const ids = [defaultSetId, otherSetId].filter(Boolean);

    if (!defaultSetId) {
      console.error('未找到默认账套名称:', defaultSetName);
      return db.close();
    }

    await ensureUserSets(user.id, ids, defaultSetId);
    console.log('已为用户分配账套并设置默认:', {
      user: user.username,
      assigned: ids,
      defaultSetId
    });
  } catch (err) {
    console.error('执行失败:', err);
  } finally {
    db.close();
  }
}

main();