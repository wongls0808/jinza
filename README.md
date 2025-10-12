# jinza - 企业管理系统

企业级管理系统（Vue 3 + Element Plus + Vite 前端，Express + PostgreSQL 后端）。包含客户、银行、收款账户、交易等模块，支持中英文切换与 CSV 导入/导出。

## 运行环境
- Node.js 18~22
- PostgreSQL 13+
- Windows PowerShell（本文档命令基于此）

## 快速开始（Windows）
1) 安装依赖
   npm install

2) 配置数据库连接（PostgreSQL）
   - 本地数据库示例：
     $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/jinza"

   - 其他环境：把连接串替换为实际地址并设置到环境变量。

3) 执行数据库迁移（首次或结构升级时）
   npm run migrate
   - 会按 migrations/ 目录下的 .sql 文件顺序执行并记录到 schema_migrations 表，可重复执行，已应用的会跳过。

4) 构建并启动服务（后端端口默认 3000）
   npm start

   或开发模式（跳过鉴权与权限校验，便于联调）：
   npm run start:dev

5) 前端开发服务器（可选，端口 5173）
   npm run frontend
   - 已将 /api 代理到 http://localhost:3000

6) 健康检查与数据库状态
   - 健康检查：GET /api/health
   - 数据库状态：GET /api/system/db-status

提示：若未设置 DATABASE_URL，依赖数据库的 API 将不可用；仅在开发阶段可设置 ALLOW_TRANSACTIONS_MOCK=1 以启用交易模块的模拟数据，生产环境请务必连接真实数据库。

## 目录概览
- server.js                 Express 启动入口（生产中同时托管打包后的前端）
- vite.config.js            Vite 配置（含 /api 代理）
- src/
  - main.js, App.vue        Vue 入口与根组件
  - i18n.js                 国际化配置
  - server/                 后端业务路由与工具
    - routes.js             主路由（注册 auth/users/customers/banks/accounts/transactions/receipts）
    - db.js                 PostgreSQL 连接池
    - auth.js               鉴权、权限、初始化 schema 与管理员
    - transactions.js       交易模块（真实 DB 路由）
    - transactionsFallback.js 无数据库时的交易模块模拟路由
- scripts/migrate.js        迁移执行器（.sql 顺序执行，带历史表）
- migrations/               SQL 迁移文件夹

## 环境变量
- PORT                         服务端口，默认 3000
- DATABASE_URL                 PostgreSQL 连接串
- JWT_SECRET                   JWT 密钥（生产务必设置）
- JWT_EXPIRES_IN               Token 有效期，默认 7d
- ALLOW_TRANSACTIONS_MOCK      开发阶段允许交易模块使用模拟数据（1 开启）
- LOG_SQL                      设置任意值以打印 SQL 执行日志

## 常见问题
1) ECONNREFUSED 或 ENOTFOUND：数据库连接失败，请检查 DATABASE_URL、数据库服务与网络可达性。
2) 权限 403：生产模式下需要具备相应 permission，首次启动会自动建表并创建 admin 用户及权限映射。
3) 银行 Logo：后端 /banks 支持上传 dataURL 或直接写 public/banks/*.svg 后使用 bank_code 渲染。
