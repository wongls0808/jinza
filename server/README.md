# Jinza Backend API Server

这是金闸管理系统的后端API服务器。

## 系统要求

- Node.js 14+
- npm 或 yarn

## 快速开始

1. 安装依赖:

```bash
npm install
# 或
yarn install
```

2. 配置环境变量:

复制 `.env.example` 到 `.env` 并配置必要的变量:

```
# 基本配置
PORT=8080
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# 日志配置
LOG_LEVEL=info
```

3. 启动服务器:

```bash
npm start
# 或
yarn start
```

开发模式:

```bash
npm run dev
# 或
yarn dev
```

## 部署到 Render

此项目配置为在 Render.com 上部署:

1. 使用仓库根目录的 `render.yaml` 文件自动部署
2. 服务配置:
   - 根目录: `server`
   - 构建命令: `npm install`
   - 启动命令: `npm start`
   - 健康检查路径: `/api/health`

如遇部署失败:
- 检查 Render 日志详细错误信息
- 确认 `package.json` 中包含所有必要依赖
- 验证 `engines` 字段中的 Node.js 版本兼容

## API 文档

### 认证

#### 登录

```
POST /api/login
```

请求体:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### 获取当前用户信息

```
GET /api/user/info
```

Header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 分类管理

#### 获取分类列表

```
GET /api/categories
```

## 部署

### Render

本项目可以直接部署到 Render 平台，使用项目中的 `render.yaml` 配置文件进行部署。

1. 在 Render 平台创建一个新的 Web Service
2. 连接到您的 GitHub 仓库
3. Render 将自动检测配置并部署

## 许可证

MIT