# GrapesJS 离线资源

本目录用于存放 GrapesJS 可视化编辑器的离线资源文件，确保系统在无网络环境下也能正常使用模板编辑功能。将以下文件放入本目录以启用可视化编辑器的离线加载：

## 文件结构
- `grapes.min.js`  放在 `public/libs/grapesjs/`
- `grapes.min.css`  放在 `public/libs/grapesjs/css/`

## 目录结构示例
```
public/libs/grapesjs/
 grapes.min.js        # GrapesJS 主程序文件
 css/
     grapes.min.css   # GrapesJS 样式文件
```

## 获取文件
您可以通过以下方式获取所需文件：

1. 从 CDN 下载：
   - JS文件: https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/grapes.min.js
   - CSS文件: https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/css/grapes.min.css

2. 从 npm 包安装并复制:
   ```bash
   npm install grapesjs@0.21.5
   ```
   然后从 node_modules/grapesjs/dist/ 复制文件到此目录

## 离线使用
一旦文件放置正确，系统将优先使用这些本地文件，而不是从 CDN 加载资源。当网络不可用时，这确保了模板编辑器的正常运行。

## 版本说明
系统当前兼容 GrapesJS v0.21.5，使用其他版本可能导致功能异常。
