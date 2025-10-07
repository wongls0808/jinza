# GrapesJS 离线资源# GrapesJS 离线资源



本目录用于存放 GrapesJS 可视化编辑器的离线资源文件，确保系统在无网络环境下也能正常使用模板编辑功能。将以下文件放入本目录以启用可视化编辑器的离线加载：



## 文件结构- grapes.min.js → 放在 `public/libs/grapesjs/`

- css/grapes.min.css → 放在 `public/libs/grapesjs/css/`

```

public/libs/grapesjs/目录结构示例：

├── grapes.min.js        # GrapesJS 主程序文件

└── css/public/

    └── grapes.min.css   # GrapesJS 样式文件└── libs/

```    └── grapesjs/

        ├── grapes.min.js

## 安装说明        └── css/

            └── grapes.min.css

1. 下载 GrapesJS 资源文件：

放置后刷新页面，编辑器会优先从本地路径加载，不依赖外网。
   - 主程序：https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/grapes.min.js
   - 样式表：https://cdn.jsdelivr.net/npm/grapesjs@0.21.5/dist/css/grapes.min.css

2. 将下载的文件放置在对应目录中：
   
   - 将 `grapes.min.js` 放在 `public/libs/grapesjs/` 目录下
   - 将 `grapes.min.css` 放在 `public/libs/grapesjs/css/` 目录下

3. 重启应用服务器

## 注意事项

- 如果没有提供离线资源文件，系统将尝试从 CDN 加载 GrapesJS 资源
- 建议始终提供离线资源文件，以确保在各种网络环境下都能正常使用
- 请确保文件名与路径完全匹配，不要修改文件名