# Jinza 管理系统

一个基于 Vue 3 (Vite) 前端 + Node.js (Express + TypeScript) 后端 的管理系统单体仓库结构，前端部署在 Vercel，后端部署在 Render。

## Monorepo 结构
```
root
├─ package.json (workspaces)
├─ frontend  (Vue3 + Vite + TypeScript)
├─ backend   (Express + TypeScript + Prisma ORM)
├─ vercel.json (前端部署配置重写 API)
└─ render.yaml (后端 Render 服务定义)
```

## 数据库 (Prisma + SQLite 本地)
- schema: `backend/prisma/schema.prisma`
- 本地默认使用 SQLite: `file:./dev.db`
- 生产可切换 PostgreSQL: 修改 datasource provider & `DATABASE_URL`

### 常用命令
```bash
npm run prisma:generate   # 生成客户端
npm run prisma:migrate    # 首次/开发迁移 (当前脚本默认名称 init)
```

### 切换 PostgreSQL 示例 `.env`
```
DATABASE_URL="postgresql://user:pass@host:5432/jinza?schema=public"
```

## 客户 (Customer) 模块
模型字段：`id, name, email(unique), phone, createdAt, updatedAt`

### 后端 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/customers | 列出客户（按创建时间倒序） |
| GET | /api/customers/:id | 获取单个客户 |
| POST | /api/customers | 创建客户 `{ name, email, phone? }` |
| PUT | /api/customers/:id | 更新客户 `{ name, email, phone? }` |
| DELETE | /api/customers/:id | 删除客户 |

### 前端页面
- 路由：`/customers`
- 功能：列表展示 + 新建 + 删除（简易示例）

## 前端 (frontend)
- 技术：Vite + Vue3 + Pinia + Vue Router + Axios
- 开发端口：5173 (可在 `vite.config.ts` 中修改)
- API 代理：开发模式下 `/api` 代理到 `VITE_API_BASE` (默认 http://localhost:4000)

### 环境变量示例 (.env.local)
```
VITE_API_BASE=http://localhost:4000
```

## 后端 (backend)
- 技术：Express + TypeScript + Helmet + CORS + Morgan + Prisma
- 默认端口：4000 (可通过环境变量 PORT 调整)
- 环境变量：`PORT`, `NODE_ENV`, `DATABASE_URL`

### 环境变量示例 (.env)
```
PORT=4000
NODE_ENV=development
DATABASE_URL=file:./dev.db
```

## 开发命令
| 命令 | 说明 |
|------|------|
| `npm run dev:frontend` | 启动前端开发服务器 (Vite) |
| `npm run dev:backend`  | 启动后端开发服务器 (tsx watch) |
| `npm run build`        | 构建前后端 |
| `npm run start`        | 启动已构建后端 |
| `npm run prisma:generate` | 生成 Prisma 客户端 |
| `npm run prisma:migrate`  | 执行开发迁移 |

## 部署到 Vercel (前端)
1. 连接 GitHub 仓库
2. Root 目录：仓库根即可
3. Build Command: `npm --workspace frontend run build`
4. Output Directory: `frontend/dist`
5. Install Command: `npm install`
6. 环境变量：`VITE_API_BASE=https://your-render-backend.onrender.com`

`vercel.json` 中 `rewrites` 允许在前端直接使用 `/api/*` 调用后端。

## 部署到 Render (后端)
- Root: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/index.js`
- 环境变量：`DATABASE_URL`、`PORT`、`NODE_ENV`

若使用 PostgreSQL，需在 Render 上创建数据库并将连接串填入。

## 简易健康检查
- `GET /api/health` => `{ status: 'ok', timestamp }`

## 后续可扩展方向
- 用户认证 (JWT / Session)
- RBAC 与数据隔离（多租户）
- 更完善的日志（pino + trace id）
- OpenAPI (swagger) 自动文档
- 测试：后端 (Vitest/Supertest)、前端 (Vitest + Vue Test Utils)
- CI (GitHub Actions) 构建与 Lint
- 缓存层 (Redis) + 速率限制
- 前端 UI 框架 (Element Plus / Naive UI)

## 许可证
待定（可选择 MIT）。
