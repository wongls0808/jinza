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
本文档自动补充了运行与安全说明，后续可继续扩展 API 文档与 ER 图。