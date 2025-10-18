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

### 附：403 Forbidden（交易保存/编辑/删除失败）

现象：
- `POST /api/transactions`、`PUT /api/transactions/:id` 或 `POST /api/transactions/batch-delete` 返回 403；
- 前端控制台报错：保存交易失败: Error: Forbidden。

原因：
- 生产环境开启了严格权限检查，当前用户缺少交易写入或删除权限。

修复步骤（在生产数据库执行）：

```sql
-- 1) 确保权限条目存在
insert into permissions(code, name) values
    ('manage_transactions','交易写入'),
    ('delete_transactions','交易删除')
on conflict(code) do nothing;

-- 2) 授予给管理员（将 admin 替换为你的管理员用户名）
insert into user_permissions(user_id, permission_id)
select u.id, p.id
from users u
join permissions p on p.code in ('manage_transactions','delete_transactions')
where u.username = 'admin'
and not exists (
    select 1 from user_permissions up where up.user_id = u.id and up.permission_id = p.id
);
```

完成后请在前端：
1) 退出并重新登录（刷新令牌中的权限集合）；
2) 再次尝试保存/编辑/删除交易；
3) 可访问 `/api/auth/me` 检查返回的 `perms` 是否包含上述权限。

---

## 2025-10-19 修复：FX 管理“生成结汇单”按钮点击无反应

现象：
- 在“结汇管理 > 结汇区”点击“生成结汇单”没有任何反应，也无错误提示。

影响范围：
- 仅影响结汇创建动作；付款区不受影响；其他模块不受影响。

根因：
- `src/views/FXManagement.vue` 的 `createSettlement()` 中误用了不存在的变量 `customers.value`，应为 `allCustomers.value`，导致运行时异常被吞并，按钮点击无反馈。

修复：
- 将以下两处引用统一改为 `allCustomers.value`（已提交到 main）：
    - 读取最新税率：`const latest = allCustomers.value.find(c => c.id === customerId.value)`
    - 提交单据用客户名：`const found = allCustomers.value.find(c => c.id === customerId.value)`

变更文件：
- `src/views/FXManagement.vue`

验证步骤：
1) 进入“结汇管理”。
2) 选择结汇日期、选择有 MYR 余额的客户、输入汇率。
3) 在“已匹配交易”勾选至少一条记录；
4) 点击“生成结汇单”：
     - 成功提示“已生成结汇单”；
     - 下方勾选清空并刷新，已结汇项目不再出现；
     - 结汇日期重置为今天。

回滚方案：
- 如需回滚，可将上述两处改回原状，但会重新引入问题；建议仅用于问题复现，不用于生产。

部署状态：
- ✅ 2025-10-19 20:44 本地修复完成，git push 成功
- ✅ 修复代码已提交到 main 分支 (commit: 280203a)
- ✅ 新构建文件哈希: FXManagement-a6b79e83.js
- ⚠️  生产环境如仍显示错误，可能需要清除浏览器缓存或等待 CDN 更新

后续改进（可选）：
- 在 `createSettlement()` 外层增加 try/catch，并在 catch 中使用 `ElMessage.error` 提示异常，避免未来无提示失败。