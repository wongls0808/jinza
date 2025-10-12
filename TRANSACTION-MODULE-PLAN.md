# 入账管理模块重构计划

本文档提供了重新实现入账管理模块的计划和指导。

## 背景

原有的入账管理模块存在严重的问题，特别是401未授权错误，经过多次尝试修复无效。我们决定完全删除原有模块，并从头重新实现。

## 已删除的内容

以下与入账管理相关的代码已被移除：

1. 前端组件 `src/views/AccountManagement.vue`
2. 路由定义 `/account-management`
3. 导航栏和首页入口
4. 后端API路由 `/api/account-management` 和 `/api/account-management/import`
5. 权限定义 `view_account_management`
6. 数据库表 `account_management`
7. 相关迁移文件

## 重新实现计划

### 第一阶段：数据库设计

创建新的迁移文件，定义更好的表结构：

```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    cheque_ref_no VARCHAR(100),
    description TEXT,
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2),
    category VARCHAR(100),
    reference_1 VARCHAR(255),
    reference_2 VARCHAR(255),
    reference_3 VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_number, transaction_date, cheque_ref_no)
);
```

### 第二阶段：后端API实现

实现以下API端点：

1. `GET /api/transactions` - 获取交易列表，支持分页、排序和筛选
2. `POST /api/transactions` - 添加新的交易记录
3. `PUT /api/transactions/:id` - 更新交易记录
4. `DELETE /api/transactions/:id` - 删除交易记录
5. `POST /api/transactions/import` - 批量导入交易记录
6. `GET /api/transactions/export` - 导出交易记录
7. `GET /api/transactions/stats` - 获取统计信息

### 第三阶段：前端组件实现

1. 创建新的视图组件 `TransactionsView.vue`
2. 设计现代化的交易列表界面，包括：
   - 高级筛选功能（日期范围、账户、金额）
   - 交易类别区分和标记
   - 支持批量操作
   - 余额自动计算
   - 图表数据可视化

3. 创建导入/导出功能：
   - CSV模板下载
   - 支持多种银行格式导入
   - 导入预览和验证

### 第四阶段：权限和路由配置

1. 添加新的权限：
   - `view_transactions` - 查看交易记录
   - `manage_transactions` - 管理交易记录

2. 配置路由：
```javascript
{
  path: '/transactions',
  name: 'transactions',
  component: TransactionsView,
  meta: { perm: 'view_transactions' }
}
```

3. 添加导航和首页入口

### 第五阶段：测试和部署

1. 单元测试和集成测试
2. 生产环境部署脚本
3. 用户指南和操作手册

## 时间线

- 第一阶段：1天
- 第二阶段：2-3天
- 第三阶段：2-3天
- 第四阶段：1天
- 第五阶段：1-2天

总计：约7-10天工作时间

## 注意事项

1. 确保新实现的模块具有良好的错误处理机制
2. 增强输入验证和数据安全性
3. 改进用户体验，使界面更直观易用
4. 添加适当的日志记录，便于调试和审计
5. 考虑未来可能的功能扩展