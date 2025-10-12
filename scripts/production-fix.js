// 生产环境修复脚本
// 此脚本创建 account_management 表并更新 AUTH_USER
// 由于没有直接访问生产环境数据库的权限，我们需要提供适用于生产环境的说明

// 1. 创建 account_management 表的SQL语句
const createTableSQL = `
CREATE TABLE IF NOT EXISTS account_management (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    cheque_ref_no VARCHAR(100),
    debit_amount DECIMAL(15, 2),
    credit_amount DECIMAL(15, 2),
    reference_1 VARCHAR(255),
    reference_2 VARCHAR(255),
    reference_3 VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_number, transaction_date)
);
`;

// 2. 重置用户权限的前端代码
const resetAuthScript = `
// 清除当前认证信息
localStorage.removeItem('auth_user');

// 重新登录系统以获取正确的权限
// 或手动设置开发者token（仅开发环境可用）
`;

// 3. 查看用户是否具有'view_account_management'权限的SQL
const checkPermissionSQL = `
SELECT p.code, p.name 
FROM permissions p
JOIN user_permissions up ON p.id = up.permission_id
JOIN users u ON u.id = up.user_id
WHERE u.username = '用户名' AND p.code = 'view_account_management';
`;

// 4. 为用户添加'view_account_management'权限的SQL
const addPermissionSQL = `
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u, permissions p
WHERE u.username = '用户名' AND p.code = 'view_account_management'
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission_id = p.id
);
`;

// 5. 确保'view_account_management'权限存在的SQL
const ensurePermissionSQL = `
INSERT INTO permissions (code, name)
VALUES ('view_account_management', '入账管理')
ON CONFLICT (code) DO NOTHING;
`;

console.log('====== 生产环境修复步骤 ======');
console.log('1. 创建表SQL:', createTableSQL);
console.log('2. 检查权限SQL:', checkPermissionSQL);
console.log('3. 确保权限存在SQL:', ensurePermissionSQL);
console.log('4. 添加权限SQL:', addPermissionSQL);
console.log('5. 前端重置认证:', resetAuthScript);
console.log('==============================');
console.log('请在Railway平台执行以上SQL命令，或使用数据库管理工具连接到生产环境数据库执行。');