# 前后端链接修复与测试说明

## 问题分析与修复
在点击"账套配置"时，前端报告"服务器错误"，这是因为后端没有正确挂载 `/api/tenants` 路由。

### 已修复的内容
1. 在 `server/index.js` 中添加了 API 路由挂载代码：
   ```javascript
   // 导入API路由 (包含tenant、uploads等路由)
   const apiRoutes = require('./routes/api.routes');
   app.use('/api', apiRoutes);

   // 静态文件服务 - 配置uploads目录为静态资源
   app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
   ```

2. 简化了 `server/routes/api.routes.js` 文件，移除了对不存在的控制器和中间件的引用，确保 `tenants` 路由能够正确挂载：
   ```javascript
   // 租户和上传路由 (开放给前端访问)
   const tenantsRoutes = require('./tenants.routes');
   router.use('/tenants', tenantsRoutes);
   ```

3. 为服务器安装了缺失的依赖：
   ```
   npm install bcryptjs mongoose csv-writer
   ```

4. 确保 `server/uploads` 目录存在，以便上传文件能够正确保存：
   ```
   mkdir -Force C:\Users\Administrator\Desktop\jinza\server\uploads
   ```

5. 已将所有修改提交并推送到主分支。

## 运行与测试说明

### 本地开发运行服务器
1. 启动后端服务器：
   ```bash
   cd C:\Users\Administrator\Desktop\jinza\server
   node index.js
   ```

2. 在另一个终端中启动前端开发服务器：
   ```bash
   cd C:\Users\Administrator\Desktop\jinza
   npm run dev
   ```

### 测试 API 端点
1. 测试健康检查端点：
   ```bash
   # 本地测试
   Invoke-RestMethod -Uri http://localhost:8080/health -Method GET
   
   # 远程测试
   Invoke-RestMethod -Uri "https://jinza-backend.onrender.com/api/health" -Method GET
   ```

2. 测试租户 CRUD 操作：
   ```bash
   # 列出所有租户
   Invoke-RestMethod -Uri "https://jinza-backend.onrender.com/api/tenants" -Method GET
   
   # 创建租户
   $body = @{
     name = "测试账套"
     code = "TEST001"
   } | ConvertTo-Json
   Invoke-RestMethod -Uri "https://jinza-backend.onrender.com/api/tenants" -Method POST -Body $body -ContentType "application/json"
   
   # 更新租户
   $updateBody = @{
     name = "更新账套"
   } | ConvertTo-Json
   Invoke-RestMethod -Uri "https://jinza-backend.onrender.com/api/tenants/{id}" -Method PUT -Body $updateBody -ContentType "application/json"
   
   # 删除租户
   Invoke-RestMethod -Uri "https://jinza-backend.onrender.com/api/tenants/{id}" -Method DELETE
   ```

### 前端与后端交互
- 前端已配置为自动处理 API 错误，包括 404 错误，将在本地提供数据备份
- 上传功能已配置为先尝试上传到后端，失败时会回退到本地 dataURL 存储
- 前端默认通过 `.env.development` 文件中的 `VITE_API_BASE_URL=/api` 配置，使用 Vite 开发服务器代理到本地后端
- 生产环境通过 `.env.production` 文件中的 `VITE_API_BASE_URL=https://jinza-backend.onrender.com` 配置，直接连接到远程后端

### 注意事项
1. 远程环境当前仍返回 `/api/tenants` 的 404 错误，可能是因为最新的代码还未部署，或者远程 API 路由结构不同
2. 前端有回退机制，当后端不可用时会显示警告并在本地保存/删除数据
3. 要充分测试，请确保本地服务器已启动，或者远程后端已完成部署并提供了相应的 API 端点

## 下一步建议
1. 等待远程部署完成，重新测试远程 API 端点
2. 考虑为后端添加更多日志和调试信息，以便更容易排查问题
3. 根据远程 API 实际返回调整前端代码，确保两端完全匹配