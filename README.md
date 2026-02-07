# AutoCount 同步服务（基础版）

这个项目提供一个最小可用的 AutoCount Cloud Accounting 同步骨架，包含：
- 统一的 API 客户端（Header 认证）
- 列表分页拉取与增量时间窗口
- 本地状态与数据落盘（方便二次开发）

## 快速开始

1. 复制环境变量模板：

```
copy .env.example .env
```

2. 填写 `.env`：

- `AUTOCOUNT_BASE_URL`：AutoCount API 根地址（参考官方文档）
- `AUTOCOUNT_ACCOUNT_BOOK_ID`：账套 ID
- `AUTOCOUNT_KEY_ID` / `AUTOCOUNT_API_KEY`：API Key

3. 查看可同步实体：

```
npm run list
```

4. 同步全部：

```
npm run sync
```

5. 同步某个实体：

```
npm run sync:entity -- account
```

## 目录结构

- `src/autocount`：API 客户端与分页逻辑
- `src/sync`：实体配置与同步逻辑
- `src/storage`：状态与数据落盘
- `data`：同步输出与状态文件
- `web`：前端页面与 UI

## 说明

本项目为“再开发”骨架，后续可在 `src/sync/entities.js` 中扩展更多 AutoCount 接口。
官方文档参考：<https://accounting-api.autocountcloud.com/documentation/>
