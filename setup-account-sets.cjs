const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/app.db');

// 添加一些测试账套
async function setupAccountSets() {
  // 1. 创建几个账套
  const accountSets = [
    { name: '总公司', code: 'HQ', registration_number: 'REG123456', tax_number: 'TAX123456' },
    { name: '北京分公司', code: 'BJ', registration_number: 'REG789012', tax_number: 'TAX789012' },
    { name: '上海分公司', code: 'SH', registration_number: 'REG345678', tax_number: 'TAX345678' }
  ];

  // 获取所有用户ID
  db.all("SELECT id FROM users", [], (err, users) => {
    if (err) {
      console.error('获取用户失败:', err);
      db.close();
      return;
    }

    if (users.length === 0) {
      console.log('没有用户，无法分配账套');
      db.close();
      return;
    }

    console.log(`找到 ${users.length} 个用户`);

    // 创建账套
    const insertAccountSet = db.prepare("INSERT INTO account_sets (name, code, registration_number, tax_number, is_active) VALUES (?, ?, ?, ?, 1)");
    
    accountSets.forEach((set, index) => {
      insertAccountSet.run(set.name, set.code, set.registration_number, set.tax_number, function(err) {
        if (err) {
          console.error(`添加账套 ${set.name} 失败:`, err);
          return;
        }
        
        const accountSetId = this.lastID;
        console.log(`添加账套成功: ${set.name}, ID: ${accountSetId}`);
        
        // 为每个用户分配账套
        users.forEach((user, userIndex) => {
          // 第一个账套设为默认
          const isDefault = index === 0 ? 1 : 0;
          
          db.run(
            "INSERT INTO user_account_sets (user_id, account_set_id, is_default) VALUES (?, ?, ?)",
            [user.id, accountSetId, isDefault],
            (err) => {
              if (err) {
                console.error(`为用户 ${user.id} 分配账套 ${accountSetId} 失败:`, err);
              } else {
                console.log(`用户 ${user.id} 已分配到账套 ${accountSetId}, 默认: ${isDefault}`);
              }

              // 在所有操作完成后关闭数据库
              if (index === accountSets.length - 1 && userIndex === users.length - 1) {
                console.log('账套设置完成！');
                db.close();
              }
            }
          );
        });
      });
    });
  });
}

setupAccountSets();