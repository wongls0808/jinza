## 企业管理系统（jinza）最小骨架

这是一个最小可运行的同仓结构：
- 前端：Vite + Vue 3
- 后端：Express（提供 /api/health）

当前分支仅用于新项目起步，历史完整功能请查看备份分支。

### 快速开始
1) 安装依赖
- Windows PowerShell:
  npm install

2) 启动后端（端口 3000）
  npm run dev

3) 启动前端（端口 5173）
  npm run frontend

4) 构建前端产物
  npm run build

### 开发说明
- 前端开发服务器已将 /api 代理到 http://localhost:3000
- 如仅需纯前端，可删除 server.js 与 express 依赖

### 目录结构
- server.js       简易 Express 服务（仅健康检查）
- index.html      Vite 入口
- src/
  - main.js       Vue 入口
  - App.vue       根组件（展示登录占位/首页示例）
  - views/Home.vue 示例页面
- vite.config.js  Vite 配置（含 /api 代理）
- package.json    脚本与依赖

### 环境变量（可选）
- PORT            后端端口，默认 3000

祝开发顺利！