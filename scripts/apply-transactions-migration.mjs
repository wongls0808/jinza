// 交易表迁移应用脚本
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyTransactionsMigration() {
  try {
    console.log('开始创建交易表...');
    
    // 读取迁移文件
    const migrationPath = path.join(__dirname, '..', 'migrations', '20251013_create_transactions_table.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // 执行迁移
    await query(migrationSql);
    
    // 确保权限表中存在相应权限
    await query(`
      INSERT INTO permissions (code, name) 
      VALUES 
        ('view_transactions', '查看交易'),
        ('manage_transactions', '管理交易')
      ON CONFLICT (code) DO NOTHING
    `);
    
    console.log('迁移成功完成！transactions 表已创建，权限已添加。');
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

applyTransactionsMigration();