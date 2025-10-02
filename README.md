# 企业管理系统 (jinza)

## 快速开始

1. 安装依赖
```
npm install
```
2. 复制环境变量示例
```
cp .env.example .env
```
3. 启动后端 (含 API / 会话 / SQLite 初始化)
```
npm run dev
```
4. 启动前端（若前端单独有命令，可使用 `vite preview` 或直接打开开发入口）

> 默认管理员账号: `admin / admin123`（首次登录后请及时修改密码）

## 环境变量说明 (.env)
| 变量 | 说明 | 示例 |
| ---- | ---- | ---- |
| PORT | 后端监听端口 | 3000 |
| SESSION_SECRET | 会话加密密钥（生产必须是高强度随机值） | 自定义复杂串 |
| FRONTEND_ORIGIN | 允许的前端 Origin | http://localhost:5173 |
| LOGIN_RATE_LIMIT_WINDOW_MS | 登录限流窗口（毫秒） | 60000 |
| LOGIN_RATE_LIMIT_MAX | 窗口内最大登录尝试次数 | 10 |

## 安全增强（已初步集成）
- helmet：基础安全头
- express-rate-limit：对 /api/login 进行速率限制
- dotenv：集中管理敏感配置

## 后续建议（节选）
- 引入路由层/服务层拆分（当前 server.js 体积较大）
- 使用 vue-router + Pinia 改造前端导航与状态
- 抽象统一响应与错误码规范
- 增加输入校验（zod/express-validator）
- 增加测试（API + 单元 + 简单 E2E）

## 数据库
SQLite 单文件 (data/app.db) 自动初始化。

### 数据持久化与部署
默认数据目录为 `./data`（项目根目录下）。你可以通过环境变量 `DATA_DIR` 自定义，例如：

```
DATA_DIR=/var/lib/jinza-data
```

推荐在生产：
1. 使用持久卷/挂载盘指向 `DATA_DIR`，防止容器重建丢失。
2. 启用我们已配置的 SQLite WAL 模式：提高并发与崩溃恢复能力（启动日志可见 `journal_mode=WAL`）。
3. 定期备份：
	- 在线热备：复制 `*.db` 和 `*-wal` `*-shm` 文件（尽量在低写入窗口）。
	- 冷备：短暂锁写（或停机）后直接归档整个目录。
4. 迁移到外部数据库（中长期）：
	- 选择 PostgreSQL / MySQL。
	- 依据当前 schema 生成迁移脚本（可用 Prisma 或 Knex 重建模型）。
	- 将数据导出：使用 `sqlite3 app.db .dump > dump.sql`，再清洗自增/类型后导入目标库。

#### Render / 容器平台策略
若使用 Render 免费实例，文件系统可能在重启或迁移时被重置，务必：
- 配置持久化卷 (Persistent Disk) 挂载到 `/var/lib/jinza-data` 并在 `.env` 设置 `DATA_DIR=/var/lib/jinza-data`。
- 或者将关键表迁移至托管 PostgreSQL（推荐长期方案）。

#### 监控与健康检查建议
- 定时任务：每日运行 `VACUUM`（可选）与备份脚本。
- 监控数据库文件大小阈值，超过预期告警。
- 建立 `/healthz` 端点（后续可添加）返回数据库 `SELECT 1` 结果。

#### 手动备份示例（Linux）
```
tar czf backup-$(date +%Y%m%d%H%M).tar.gz -C /var/lib jinzA-data
``` 
或使用 sqlite3 原生命令：
```
sqlite3 app.db ".backup 'backup.db'"
```

> 注意：WAL 模式下备份时需包含 `app.db`, `app.db-wal`, `app.db-shm`。

### Customers 表软删除
- 新增列：`deleted_at DATETIME`。
- 删除操作：`DELETE /api/customers/:id` 默认软删除 (UPDATE 设置 `deleted_at=CURRENT_TIMESTAMP`)，传 `?force=1` 则物理删除。
- 列表获取：`GET /api/customers` 默认过滤 `deleted_at IS NULL`；`?includeDeleted=1` 包含软删除。
- 恢复：`PATCH /api/customers/:id/restore` 取消软删除（`deleted_at=NULL`）。
- 回收站视图：前端 `回收站` 菜单加载 `includeDeleted=1` 并筛选有 `deleted_at` 的记录，支持恢复与彻底删除。
- 清理建议：可添加计划任务物理删除软删除超过 90 天记录。

### 标签系统
- `customers.note` 字段现存储标签 JSON 数组。
- 前端展示前 3 个标签，其余折叠为 `+N`。
- 标签颜色：采用哈希 → HSL 动态生成（固定 55% 饱和 / 50% 亮度），确保同名标签不同卡片颜色一致。
- 限制：最多 10 个标签，单标签 ≤ 20 字符。

## 目录结构（核心）
```
server.js
src/
	main.js
	App.vue
	views/
	utils/api.js
data/
```

---
本文档自动补充了运行与安全说明与近期新增：标签系统、客户软删除策略。后续可继续扩展 API 文档与 ER 图。