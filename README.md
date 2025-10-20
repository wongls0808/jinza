# jinza - BSB | BESTRADE SB

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


## 银行 Logo 策略

- 存储位置：项目根目录的 `public/banks/`
- 命名规范：按银行代码命名，全部小写，例如 `icbc.svg`、`maybank.png`
- 优先格式：SVG 优先；如无则回退到 PNG，再回退到 JPG
- 上传方式：在“银行列表”页面上传 Logo 文件时，后端会自动以银行代码命名并写入 `public/banks/`，数据库仅记录标准化路径 `/banks/<code>.<ext>`（或可为空以启用前端回退）
- 前端展示：各处始终按 `/banks/<code>.svg` 加载，图片加载失败时前端会依次尝试 `.png`、`.jpg`，最终使用占位

注意：旧有的外链 URL 将不再使用；若仍保留数据库中的 `logo_url` 字段，其值仅用于兼容读取 `/banks/<code>.<ext>` 路径，不建议填写外站地址。

## 生产部署指南

本项目由 `server.js` 同时托管后端 API 与打包后的前端（Vite 产物在 `dist/`）。生产部署建议流程：

1) 构建前端
   - 运行 `npm run build` 生成 `dist/` 目录
2) 启动服务
   - 运行 `npm start`（Express 会托管 `dist/` 静态资源，并提供 SPA fallback）

关键环境变量（生产）：
- NODE_ENV=production
- PORT=3000（或平台注入的端口变量）
- DATABASE_URL=postgresql://user:pass@host:5432/dbname
- JWT_SECRET=强随机密钥
- CORS 配置（二选一）
  - CORS_ORIGINS=以逗号分隔的 Origin 列表，支持通配符域名（如 `*.example.com`）或完整 Origin（含协议与端口）
  - CORS_ALLOW_ALL=1（紧急放开所有来源；上线排障可临时使用，尽快改回白名单）
- 可选：DATA_DIR=持久化数据目录（例如挂载卷的路径，用于 `/uploads` 等）

静态资源与 SPA：
- `index.html` 设置为 `Cache-Control: no-store`，避免旧入口引用新 chunk 造成白屏
- 带哈希文件（js/css/font/img）启用 `immutable` 长缓存
- SPA fallback 仅对“非 /api 且不包含点”的路径生效，确保 `*.js/*.css` 等静态请求不被错误回退

### Railway 部署步骤（示例）
1) 在 Railway 连接本仓库（main 分支）
2) 在 Variables 设置：
   - NODE_ENV=production
   - DATABASE_URL=你的 PostgreSQL 连接串
   - JWT_SECRET=强随机密钥
   - 任选其一：CORS_ALLOW_ALL=1（全部放开）或 CORS_ORIGINS=你的域名列表（如 `https://app.example.com,https://admin.example.com` / `*.example.com`）
   - 如需持久化 `/uploads`，为服务添加 Volume 并设置 DATA_DIR=/data（示例路径）
3) 部署命令：Railway 会自动安装依赖；建议明确设置：
   - Build Command: `npm run build`
   - Start Command: `npm start`
4) 部署完成后，验证：
   - GET `/api/health` → { status: 'ok' }
   - GET `/api/version` 查看版本与时间
   - 浏览器访问站点首页并检查 Network：入口引用当前 `index-*.js`，无跨域报错

常见部署问题排查：
- 浏览器白屏且请求旧 chunk 名：清理 CDN/浏览器缓存；确认入口 `index.html` 响应头为 `no-store`
- 资产 404 被回退到 HTML：检查反代/网关重写规则，确保仅对“非点路径”回退
- CORS 报错：在生产设置 `CORS_ORIGINS` 或临时 `CORS_ALLOW_ALL=1`，并重启服务

