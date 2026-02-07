# Railway 部署指南

## 部署步骤

### 1. 推送到 GitHub
```bash
git add .
git commit -m "add PostgreSQL persistence"
git push origin main
```

### 2. 在 Railway 部署
1. 访问 [Railway Dashboard](https://railway.app)
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库

### 3. 添加 PostgreSQL 数据库
1. 在 Railway 项目中点击 **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway 会自动创建 PostgreSQL 实例并注入 `DATABASE_URL` 环境变量
3. 无需手动配置数据库连接字符串

### 4. 配置环境变量
在 Railway 项目的 **Variables** 中设置：

**必需（如使用后端代理模式）：**
- `AUTOCOUNT_BASE_URL`: `https://accounting-api.autocountcloud.com`
- `AUTOCOUNT_ACCOUNT_BOOK_ID`: 账套 ID
- `AUTOCOUNT_KEY_ID`: API Key ID
- `AUTOCOUNT_API_KEY`: API 密钥

**自动注入（无需手动设置）：**
- `DATABASE_URL`: Railway PostgreSQL 自动注入
- `PORT`: Railway 自动注入

**可选：**
- `DB_SSL`: 设为 `false` 如数据库不需要 SSL（Railway 默认需要）

### 5. 部署
Railway 检测到代码推送后自动部署。首次部署时会自动创建数据库表。

## 数据持久化架构

```
┌─────────────────────────────┐
│         浏览器前端           │
│  (web/index.html + app.js)  │
│                             │
│  启动 → GET /api/data/all   │  ← 从数据库加载全部数据
│  同步 → POST /api/data/sync │  ← 同步后写入数据库
│  配置 → POST /api/config    │  ← 配置写入数据库
│  PI  → POST /api/pi         │  ← PI 写入数据库
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│       Node.js 后端           │
│     (src/server.js)          │
│                              │
│  静态文件服务 (web/)          │
│  AutoCount CORS 代理         │
│  数据库 CRUD API             │
└──────────┬───────────────────┘
           │
┌──────────▼──────────────────┐
│     PostgreSQL 数据库        │
│                              │
│  app_config   - API 配置     │
│  sync_state   - 同步状态     │
│  sync_data    - 实体数据     │
│  purchase_pi  - 本地 PI      │
└──────────────────────────────┘
```

### 数据库表说明

| 表名 | 用途 | 说明 |
|------|------|------|
| `app_config` | 存储 API 配置 | key-value 形式，JSONB |
| `sync_state` | 各实体同步状态 | 记录最后同步时间 |
| `sync_data` | AutoCount 同步数据 | 按实体名存储整批 JSONB |
| `purchase_pi` | 本地 PI 数据 | 每条 PI 独立一行 |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | Web 界面 |
| GET | `/health` | 健康检查 |
| GET | `/api/data/all` | 加载全部持久化数据 |
| POST | `/api/data/sync` | 保存同步数据（单实体） |
| GET | `/api/config` | 获取配置 |
| POST | `/api/config` | 保存配置 |
| POST | `/api/syncstate` | 保存同步状态 |
| GET | `/api/pi` | 获取所有 PI |
| POST | `/api/pi` | 创建/更新 PI |
| DELETE | `/api/pi/:docNo` | 删除 PI |
| POST | `/api/proxy` | AutoCount API 代理 |

## 故障排除

### 数据库连接失败
- 确认 Railway PostgreSQL 插件已添加
- 检查 `DATABASE_URL` 环境变量是否存在
- 查看 Railway 运行日志中的错误信息

### 刷新后数据丢失
- 确认数据库连接正常（访问 `/health` 查看 `db: true`）
- 打开浏览器控制台查看网络请求是否报错
- 确认同步操作完成后日志显示 "数据持久化" 相关信息

### 首次部署数据为空
- 这是正常的，需要先配置 API 凭证并执行同步
- 配置和同步数据会自动持久化到数据库
