"# Railway 部署快速指南

## 一键部署

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/autocount-sync?referralCode=deploy)

## 手动部署步骤

### 1. 准备项目
```bash
git clone [你的仓库地址]
cd jinza-os-autocount-sync
```

### 2. 推送到GitHub
```bash
git add .
git commit -m "准备Railway部署"
git push origin main
```

### 3. 在Railway部署
1. 访问 [Railway Dashboard](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权并选择你的仓库
5. Railway会自动部署

### 4. 配置环境变量
在Railway项目设置中，添加以下环境变量：

**必需配置：**
- `AUTOCOUNT_BASE_URL`: AutoCount API基础地址
- `AUTOCOUNT_ACCOUNT_BOOK_ID`: 账套ID
- `AUTOCOUNT_KEY_ID`: API Key ID
- `AUTOCOUNT_API_KEY`: API密钥

**可选配置：**
- `SYNC_OUTPUT_DIR`: 数据目录（默认：data）
- `SYNC_MAX_PAGES`: 最大分页数（默认：500）
- `SYNC_SAVE_HISTORY`: 保存历史记录（默认：true）

## 访问服务

部署成功后，Railway会提供一个公开URL，例如：
`https://your-project.up.railway.app`

### 可用端点：
- `GET /` - 服务主页
- `GET /health` - 健康检查
- `GET /web/index.html` - Web界面
- `POST /api/ping` - 测试AutoCount连接
- `POST /api/sync` - 同步指定实体
- `POST /api/sync-all` - 同步所有实体

## 数据持久化

Railway的存储是临时的。建议：

1. **使用Railway Volume**（推荐）
   - 在Railway添加Volume插件
   - 挂载到 `/app/data` 目录

2. **配置外部存储**
   - 使用云存储（S3、Google Cloud Storage等）
   - 修改 `src/storage/state.js` 使用外部存储

## 监控和日志

- **实时日志**: 在Railway控制台查看
- **健康检查**: Railway自动监控 `/health` 端点
- **性能监控**: Railway提供基本的性能指标

## 故障排除

### 部署失败
1. 检查 `railway.json` 配置
2. 查看构建日志中的错误信息
3. 确保Node.js版本兼容（需要 >= 18.0.0）

### 服务无法启动
1. 检查环境变量是否正确配置
2. 查看运行时日志
3. 测试本地运行：`npm run server`

### API连接失败
1. 验证AutoCount API凭证
2. 检查网络连接
3. 使用 `/api/ping` 端点测试

## 扩展建议

1. **添加数据库**: 集成PostgreSQL或MongoDB
2. **定时任务**: 使用Railway的Cron Jobs
3. **监控告警**: 集成监控服务
4. **CDN加速**: 为静态文件配置CDN

## 支持

- [Railway文档](https://docs.railway.app)
- [AutoCount API文档](https://accounting-api.autocountcloud.com/documentation/)
- 项目问题请提交GitHub Issue"