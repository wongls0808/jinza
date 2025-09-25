# Jinza管理系统

基于Vue 3 + TypeScript + Vite构建的现代化后台管理系统，使用Element Plus作为UI组件库，集成Vue Router进行路由管理，使用Pinia进行状态管理。

## 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite
- **编程语言**: TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **部署环境**: 前端Vercel + 后端Render

## 功能模块

- 登录认证
- 权限管理
- 用户管理
- 内容管理
- 分类管理
- 系统设置

## 项目结构

```
jinza/
├── .github/                # GitHub相关配置
├── public/                 # 静态资源
├── src/                    # 源代码
│   ├── assets/             # 资源文件（图片、样式等）
│   ├── components/         # 公共组件
│   ├── layout/             # 布局组件
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia状态管理
│   ├── types/              # TypeScript类型定义
│   ├── utils/              # 工具函数
│   └── views/              # 页面视图
│       ├── content/        # 内容管理相关页面
│       └── system/         # 系统管理相关页面
├── index.html              # HTML入口文件
├── package.json            # 项目依赖配置
├── tsconfig.json           # TypeScript配置
└── vite.config.ts          # Vite配置
```
