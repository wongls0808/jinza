# AutoCount同步服务 Railway部署检查清单

## ✅ 已完成配置

### 1. 部署配置文件
- [x] `railway.json` - Railway部署配置
- [x] `Dockerfile` - Docker容器配置
- [x] `Procfile` - 进程定义
- [x] `.dockerignore` - Docker忽略文件
- [x] `.gitignore` - Git忽略文件

### 2. 项目配置
- [x] `package.json` - 更新了scripts和engines配置
- [x] `src/server.js` - 添加了健康检查端点和静态文件服务
- [x] 数据目录结构 - 创建了`data/.gitkeep`

### 3. 文档
- [x] `DEPLOYMENT.md` - 详细部署指南
- [x] `README-RAILWAY.md` - Railway快速部署指南
- [x] `DEPLOY-CHECKLIST.md` - 本检查清单

## 🚀 部署步骤

### 第一步：准备GitHub仓库
1. 初始化Git仓库（如果尚未初始化）
2. 将所有文件添加到Git
3. 提交并推送到GitHub

```bash
git init
git add .
git commit -m "准备Railway部署"
git branch -M main
git remote add origin [你的GitHub仓库URL]
git push -u origin main
```

### 第二步：Railway部署
1. 访问 [Railway.app](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权GitHub账户
5. 选择你的仓库
6. Railway会自动检测配置并开始部署

### 第三步：配置环境变量
在Railway项目设置中配置：

**必需环境变量：**
- `AUTOCOUNT_BASE_URL` - AutoCount API基础地址
- `AUTOCOUNT_ACCOUNT_BOOK_ID` - 账套ID
- `AUTOCOUNT_KEY_ID` - API Key ID
- `AUTOCOUNT_API_KEY` - API密钥

**可选环境变量：**
- `SYNC_OUTPUT_DIR` - 数据输出目录（默认：data）
- `SYNC_MAX_PAGES` - 最大分页数（默认：500）
- `SYNC_SAVE_HISTORY` - 保存历史记录（默认：true）
- `PORT` - 服务端口（Railway自动分配）

### 第四步：验证部署
1. 等待部署完成（约2-5分钟）
2. 访问Railway提供的URL
3. 测试健康检查端点：`[你的URL]/health`
4. 访问Web界面：`[你的URL]/web/index.html`

## 🔧 服务端点

部署成功后，以下端点可用：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 服务主页，显示可用端点 |
| `/health` | GET | 健康检查，返回服务状态 |
| `/web/index.html` | GET | 完整的Web控制台界面 |
| `/api/ping` | POST | 测试AutoCount API连接 |
| `/api/sync` | POST | 同步指定实体 |
| `/api/sync-all` | POST | 同步所有实体 |
| `/api/proxy` | POST | AutoCount API代理 |

## 💾 数据持久化

**重要：** Railway的免费版提供临时存储。建议：

### 方案A：使用Railway Volume（推荐）
1. 在Railway项目页面点击 "Plugins"
2. 添加 "Volume" 插件
3. 挂载到 `/app/data` 路径
4. 重启服务

### 方案B：配置外部存储
1. 修改 `src/storage/state.js` 使用外部存储
2. 支持S3、Google Cloud Storage等云存储
3. 或集成数据库（PostgreSQL、MongoDB）

## 📊 监控和维护

### Railway控制台功能
- **实时日志**：查看服务运行日志
- **性能指标**：CPU、内存、网络使用情况
- **健康状态**：自动监控 `/health` 端点
- **部署历史**：查看所有部署记录

### 自定义监控
1. 定期访问 `/health` 检查服务状态
2. 使用 `/api/ping` 测试AutoCount连接
3. 查看 `data/` 目录下的同步日志

## 🐛 故障排除

### 常见问题

**1. 部署失败**
- 检查 `railway.json` 语法
- 查看构建日志中的错误信息
- 确保Node.js版本兼容（需要 >= 18.0.0）

**2. 服务无法启动**
- 检查环境变量是否正确配置
- 查看运行时日志
- 测试本地运行：`npm run server`

**3. API连接失败**
- 验证AutoCount API凭证
- 检查网络连接
- 使用 `/api/ping` 端点测试

**4. Web界面无法访问**
- 确保静态文件服务正常工作
- 检查浏览器控制台错误
- 验证URL路径：`/web/index.html`

## 🔄 更新部署

### 自动部署（推荐）
- 推送到GitHub主分支会自动触发重新部署
- Railway会自动构建和部署新版本

### 手动部署
1. 在Railway控制台点击 "Redeploy"
2. 或使用Railway CLI：`railway up`

## 📞 支持

- **Railway文档**: https://docs.railway.app
- **AutoCount API文档**: https://accounting-api.autocountcloud.com/documentation/
- **项目问题**: 提交GitHub Issue

---

**部署状态**: ✅ 准备就绪
**最后检查**: 所有配置文件已就绪
**建议**: 按照上述步骤部署到Railway