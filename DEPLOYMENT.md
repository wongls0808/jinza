"# AutoCount同步服务 Railway部署指南

## 项目概述

这是一个AutoCount Cloud Accounting数据同步服务，提供CLI和Web界面两种使用方式。

## 部署到Railway

### 方法一：通过GitHub部署（推荐）

1. 将项目推送到GitHub仓库
2. 访问 [Railway](https://railway.app)
3. 点击"New Project" → "Deploy from GitHub repo"
4. 选择你的仓库
5. Railway会自动检测配置并部署

### 方法二：通过Railway CLI部署

1. 安装Railway CLI: `npm i -g @railway/cli`
2. 登录: `railway login`
3. 初始化: `railway init`
4. 部署: `railway up`

## 环境变量配置

部署后需要在Railway项目设置中配置以下环境变量：

### 必需配置

- `PORT`: 服务端口（Railway会自动分配）
- `AUTOCOUNT_BASE_URL`: AutoCount API基础地址
- `AUTOCOUNT_ACCOUNT_BOOK_ID`: 账套ID
- `AUTOCOUNT_KEY_ID`: API Key ID
- `AUTOCOUNT_API_KEY`: API密钥

### 可选配置

- `SYNC_OUTPUT_DIR`: 数据输出目录（默认：data）
- `SYNC_MAX_PAGES`: 最大分页数（默认：500）
- `SYNC_SAVE_HISTORY`: 是否保存历史记录（默认：true）

## 数据持久化

Railway提供临时存储，但建议：

1. 使用Railway的Volume插件持久化`data`目录
2. 或配置外部存储（如S3、云数据库）

## 访问服务

部署成功后：

1. Railway会提供一个公开URL
2. 访问 `https://[your-project].up.railway.app` 打开Web界面
3. API端点可通过相同URL访问

## 健康检查

- 访问 `/api/ping` 测试连接
- Railway会自动监控服务状态

## 注意事项

1. **数据安全**: 确保API密钥等敏感信息通过环境变量配置
2. **存储限制**: Railway免费版有存储限制，注意数据量
3. **自动部署**: 推送到GitHub主分支会自动触发重新部署
4. **日志查看**: 在Railway控制台查看实时日志

## 故障排除

1. **部署失败**: 检查`railway.json`和`Dockerfile`配置
2. **服务无法启动**: 检查环境变量是否正确配置
3. **API连接失败**: 验证AutoCount API凭证和网络连接
4. **存储问题**: 确保有写入`data`目录的权限

## 扩展功能

1. 添加数据库支持（PostgreSQL、MongoDB）
2. 实现定时同步任务
3. 添加用户认证
4. 集成监控和告警"

