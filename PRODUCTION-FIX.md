# 生产环境问题修复指南

## 问题描述

1. 浏览器警告：`<meta name="apple-mobile-web-app-capable" content="yes"> is deprecated`
2. API错误：`api/account-management:1 Failed to load resource: the server responded with a status of 401 ()`

## 修复步骤

### 1. Meta 标签问题 (已在代码中修复)

在 `index.html` 中添加了推荐的 meta 标签:
```html
<meta name="mobile-web-app-capable" content="yes" />
```

### 2. 401 未授权错误

此问题可能有多个原因：
1. 数据库中没有 `account_management` 表
2. 用户缺少 `view_account_management` 权限
3. 认证令牌问题

#### 解决方案 A：数据库修复

1. 连接到 Railway 生产环境数据库（通过 Railway 控制台或其他数据库客户端）
2. 执行以下SQL创建表：
```sql
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
```

3. 确保 `view_account_management` 权限存在：
```sql
INSERT INTO permissions (code, name)
VALUES ('view_account_management', '入账管理')
ON CONFLICT (code) DO NOTHING;
```

4. 确保用户有正确的权限：
```sql
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u, permissions p
WHERE u.username = '您的用户名' AND p.code = 'view_account_management'
AND NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = u.id AND up.permission_id = p.id
);
```

#### 解决方案 B：前端认证重置

如果后端设置正确，但前端认证状态有问题，用户可以：

1. 打开浏览器开发者工具（F12或右键检查）
2. 切换到控制台(Console)标签
3. 粘贴并运行以下代码：
```javascript
localStorage.removeItem('auth_user');
console.log('认证状态已重置，请刷新页面并重新登录');
```
4. 刷新页面
5. 重新登录系统

## 部署更新

通过以下步骤部署更新：

1. 推送代码变更到GitHub：
```bash
git add index.html scripts/production-fix.js scripts/production-auth-reset.js
git commit -m "修复: 添加meta标签并创建生产环境修复脚本"
git push origin main
```

2. Railway平台将自动部署更新

## 注意

- 如果您没有直接访问数据库的权限，请联系系统管理员执行SQL语句
- 确保在执行SQL前备份数据库
- 如有任何问题，请联系技术支持团队