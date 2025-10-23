# 上线前最后检查（Production Ready Checklist）

> 适用环境：Windows PowerShell / Railway / 任意 Node 18-22 运行环境

## 1) 环境变量

必须：
- DATABASE_URL = postgres://...  (生产库连接串)
- JWT_SECRET  = 至少 32 位随机字符串

强烈建议：
- DATA_DIR    = 永久卷挂载目录（用于备份与上传）
- BACKUP_ENABLED = 1
- BACKUP_SCHEDULE = 02:30  (每日定时)
- BACKUP_RETENTION_DAYS = 7 (或更长)

可选（启用邮件通知）：
- SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM  或  SES_REGION/SES_FROM
- BACKUP_EMAIL_ATTACH = 1  (发送带附件)

必须关闭（确保为 0 或未设置）：
- AUTH_BYPASS
- PERM_UI_ONLY
- ALLOW_TRANSACTIONS_MOCK

## 2) 运行数据库迁移

```powershell
$env:DATABASE_URL="<你的连接串>"; npm run migrate
```

## 3) 备份/恢复策略

- 已强制“全量备份 + 清表恢复”，恢复时会校验备份包是否完整；不完整将拒绝执行，防止 TRUNCATE CASCADE 误删数据。
- 恢复完成后会自动将有 DB LOGO 的银行行 `banks.logo_url` 规范到 `/api/banks/:id/logo`。

## 4) 付款历史银行列

- 后端已改为三段解析：CRA → 通用账户(按 account_id) → 通用账户(按 bank_account)，并返回 bank_name/code/logo_url；前端自动回退静态或文本。

## 5) 一键准备生产

提供脚本：

```powershell
# 仅检查（默认 dry-run）
$env:DATABASE_URL="<你的连接串>"; npm run prod:prepare

# 实际清理（推荐最小化清理）
$env:DATABASE_URL="<你的连接串>"; node scripts/prepare-production.mjs --apply --purge-sessions --remove-demo-data
```

说明：
- --purge-sessions  清空在线会话，强制所有用户重新登录。
- --remove-demo-data 删除 `scripts/create-test-data.mjs` 写入的演示交易记录。
- 脚本会校验关键环境变量、执行迁移、并输出告警项（如未开启自动备份）。

## 6) 构建与启动

```powershell
npm run build; npm start
```

## 7) 备份验证（可选）

```powershell
npm run backup:now
```

- 若配置 S3，将看到上传路径；若配置 SMTP/SES，将收到通知邮件。

## 8) 安全加固（可选）

- 管理员账户启用强密码，保存在安全位置；
- 定期轮换 JWT_SECRET（需要让所有人重新登录）；
- 仅允许可信源访问管理端口，开启 WAF / CDN / 反向代理的速率限制。

---

如需“合并式恢复（不清表）”或自定义清理规则，可告诉我你的具体要求与判定条件，我可以补充一条安全开关的恢复/清理脚本。

# Railway 部署指南（推荐做法）

以下步骤假设你已在 Railway 创建项目并关联本仓库。

1) Build/Start 配置
- Build 命令：Railway/Nixpacks 会自动执行 `npm ci` 与（检测到）`npm run build`；无需额外配置。
- Start 命令：`npm start`（即 `node server.js`）。服务会在有 `dist/` 时自动托管前端静态资源。

2) 数据库与环境变量
- 数据库：在 Railway 中添加 PostgreSQL 插件，并把其 `DATABASE_URL` 注入到服务环境变量。
- 必填：
  - `DATABASE_URL`（来自 Railway Postgres）
  - `JWT_SECRET`（32+ 随机字符）
- 强烈建议：
  - `DATA_DIR=/data`（需挂载卷；用于备份与上传持久化）
  - `BACKUP_ENABLED=1`（开启每日自动备份）
  - `BACKUP_SCHEDULE=02:30`（每日时间，24h 格式）
  - `BACKUP_RETENTION_DAYS=7`（本地备份保留天数）
- 可选（S3 远端备份与通知）：
  - `BACKUP_S3_BUCKET`、`BACKUP_S3_REGION`、`BACKUP_S3_PREFIX`
  - SMTP：`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM`、`BACKUP_EMAIL_ATTACH=1`
  - 或 SES：`SES_REGION`、`SES_FROM`（可配合 `AWS_REGION`）
- CORS 建议：
  - 生产建议设置 `CORS_ORIGINS` 为你的域名或 Railway 分配域（逗号分隔）。例如：`app.example.com, *.example.com`
  - 不建议在生产使用 `*` 或 `CORS_ALLOW_ALL=1`。
- 其它：
  - 缺省将对 Postgres 开启 SSL(no-verify)。如确需禁用可设 `PGSSLMODE=disable`。

3) 卷（Volumes）与持久化
- 在 Railway 服务中添加 Volume（例如大小 1–10GB），挂载路径建议 `/data`。
- 在环境变量中设置 `DATA_DIR=/data`。
- 说明：若不挂卷，容器文件系统为短暂存储，备份文件将随实例回收而丢失。若不便挂卷，强烈建议配置 S3 远端备份。

4) 一次性执行“生产准备”
- Dashboard → 服务 → Run（或 One-off）执行：
  - 干跑（校验环境并迁移，不做破坏性清理）：`npm run prod:prepare`
  - 实跑（建议选择性带上开关）：`npm run prod:prepare -- --apply --purge-sessions --remove-demo-data`
- 或使用 Railway CLI（本地登录后）：

```powershell
# 干跑
railway run npm run prod:prepare
# 实跑（示例：应用清理与清会话）
railway run npm run prod:prepare -- --apply --purge-sessions --remove-demo-data
```

5) 健康检查与冒烟测试
- 打开服务日志，确认启动日志中包含：`[static] DATA_DIR= ...`、`Server listening ...`。
- 访问接口：
  - `GET /api/health` → { status: 'ok' }
  - `GET /api/version` → { version, git, time }
  - `GET /api/system/health` → 含 DB 延迟、连接与容量信息
- UI 关键检查：
  - “付款历史”页面银行列：应看到银行名/代码/LOGO（已实现多路径回退）
  - 从“完整备份”恢复后，银行 LOGO 地址应为 `/api/banks/:id/logo`（已在恢复后标准化）

6) 自动备份运行确认
- 设置 `BACKUP_ENABLED=1` 与合适的 `BACKUP_SCHEDULE` 后，查看日志应每日触发一次：`[backup] 开始执行定时备份...`。
- 本地目录：`${DATA_DIR}/backups` 下生成 `DataBackup-*.zip`；
- 若配置了 S3，将打印目标 `s3://bucket/key`；如配置 SMTP/SES，成功后会发送通知邮件。

7) 回滚与恢复建议
- 回滚：在 Railway 选择上一个成功部署版本重新部署；如涉及数据错误，使用后台“系统 → 恢复”或 `POST /api/system/restore` 从“完整备份包”恢复。
- 注意：恢复策略为“清表+回填”，系统已在恢复前校验备份完整性，防止不完整包导致数据级联丢失。