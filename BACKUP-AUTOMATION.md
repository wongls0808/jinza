# 数据自动备份配置

本项目内置“数据库备份”自动化：每天定时导出所有表为 zip（JSON），支持上传到 S3，并通过邮件通知结果。

## 快速开启（服务端自运行定时任务）

在运行服务的进程环境中设置以下变量（.env 或部署面板/服务管理器中）：

- BACKUP_ENABLED=1 启用自动备份
- BACKUP_SCHEDULE=02:30 每日时间（24 小时制，HH:mm，默认 02:30）
- DATA_DIR=… 可选，数据目录；备份将保存到 `${DATA_DIR}/backups/`（不会通过 HTTP 暴露）
- BACKUP_TABLES=tbl1,tbl2 可选，仅备份指定表（默认全部 public 表）
- BACKUP_RETENTION_DAYS=7 可选，本地备份保留天数（默认 7 天）

可选（上传到 S3）：

- BACKUP_S3_BUCKET=your-bucket
- BACKUP_S3_REGION=ap-southeast-1（或 AWS_REGION）
- BACKUP_S3_PREFIX=backups/app1 可选，S3 路径前缀
- AWS_ACCESS_KEY_ID=…
- AWS_SECRET_ACCESS_KEY=…

可选（邮件通知）：

- BACKUP_NOTIFY_EMAILS=a@x.com,b@y.com 多个用逗号分隔
- SMTP_HOST=smtp.example.com
- SMTP_PORT=587（或 465）
- SMTP_SECURE=1 当使用 465 端口时通常为 1
- SMTP_USER=…
- SMTP_PASS=…
- SMTP_FROM=ops@example.com 可选
- BACKUP_EMAIL_ATTACH=1 可选，邮件附带 zip（文件较大时不建议）

服务启动后日志中会看到：

```
[backup] 已启用。每日 02:30 触发。目录=C:\…\uploads\backups
```

## 手动立即备份（命令行）

确保环境设置了 DATABASE_URL，然后执行：

```
npm run backup:now
```

仅备份某些表：

```
npm run backup:now -- --tables=users,permissions,transactions
```

输出例子：

```
[backup] 完成 => { file: C:\…\uploads\backups\DataBackup-20251023T023001000Z.zip, s3: { uploaded: true, … } }
```

## Windows 任务计划程序（可选）

如果不希望由服务进程内定时，也可以用“任务计划程序”独立调度命令行备份：

1. 打开“任务计划程序”，创建基本任务（每日）。
2. 触发器：选择每天，时间自定（例如 02:30）。
3. 操作：启动程序。
4. 程序/脚本：`powershell.exe`
5. 添加参数：
   -Command "cd 'C:\\path\\to\\jinza'; $env:DATABASE_URL='YOUR_CONN_STRING'; npm run backup:now"
6. 启用“使用最高权限运行”，并在“条件”中关闭睡眠唤醒限制。

## 文件位置与保留

- 本地备份目录：`${DATA_DIR}/backups/`（若未设置 DATA_DIR，则位于项目目录的 backups/，不会暴露在 /uploads 静态目录）。
- 默认保留 7 天，超期文件自动清理。

## 恢复说明

备份 zip 可通过系统管理 UI 的“数据中心 → 恢复”上传。支持两种模式：

- insert-only：只插入，不清空（可能受唯一索引限制影响）
- truncate-insert：按依赖顺序清空表并重建（重置自增，级联清理）

上线前建议：先在测试库恢复验证，再在生产执行。
