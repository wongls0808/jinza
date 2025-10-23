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