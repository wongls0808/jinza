# 账套（Tenants）与素材上传 API 文档

本文档描述前端 `Tenants` 页面与后端约定的 API（示例路径以 `/tenants` 和 `/uploads` 为准）。文档同时提供请求/响应示例、字段说明、校验规则与错误码建议，方便后端实现或前端对接。

## 概览
- 资源：账套（tenant）
- 接口前缀：`/tenants`
- 文件上传接口：`/uploads`（可选：或 `/tenants/:id/uploads`）
- 数据格式：JSON（图片/文件可用 dataURL 在 JSON 中传输，建议使用 multipart/form-data 上传实际文件并返回 URL）

---

## Tenant 对象模型
```json
{
  "id": "string",
  "name": "string",
  "code": "string",
  "registerNo": "string",
  "taxNo": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "logoData": "string | null",        // dataURL 或 fileUrl (推荐 fileUrl)
  "sealData": "string | null",
  "signatureData": "string | null",
  "templates": [
    {
      "id": "string",
      "name": "string",
      "codeFormat": "string",         // 发票编码格式，例如 INV-{YYYY}{MM}-{SEQ:4}
      "fileData": "string | null"    // dataURL 或 fileUrl
    }
  ]
}
```

字段说明：
- id: 唯一标识（后端生成或由前端指定但需保证唯一）
- name: 账套名称（必填）
- code: 账套代码（必填）
- registerNo: 注册号
- taxNo: 税号
- phone: 联系电话
- email: 邮箱
- address: 地址
- logoData/sealData/signatureData: 三个素材，可为 dataURL（临时）或后端返回的 URL（推荐）
- templates: 打印模板数组，每个模板包含 name、codeFormat、fileData（模板文件）

---

## 接口列表

### GET /tenants
- 描述：获取账套列表
- 请求参数：支持分页/过滤（可选）
- 响应：200 返回 Tenant[]

示例响应：
```json
[ { ... Tenant 对象 ... }, ... ]
```

---

### POST /tenants
- 描述：创建一个账套
- 请求体：Tenant（不含 id 或允许含空 id）
- 响应：201 创建成功，返回创建后的资源或 { id: "..." }

请求示例：
```json
{
  "name": "账套 A",
  "code": "A001",
  "logoData": "data:image/png;base64,...",
  "templates": [ { "id": "tpl1", "name": "默认", "codeFormat": "INV-{YYYY}{MM}-{SEQ:4}", "fileData": null } ]
}
```

响应示例：
```json
{ "id": "t123", "message": "created" }
```

---

### PUT /tenants/:id
- 描述：更新账套信息（整个资源替换或部分更新）
- 请求体：Tenant
- 响应：200 成功

---

### DELETE /tenants/:id
- 描述：删除账套
- 响应：200 成功

---

## 文件上传接口（推荐）
### POST /uploads
- 描述：接收文件上传（multipart/form-data），返回文件访问 URL
- 请求：multipart/form-data，字段：file（binary）
- 响应：200 { "url": "https://.../file.png", "type": "image/png" }

后续对接建议：
- 上传接口需校验文件类型（仅允许 image/png），并返回可外链访问的 URL。
- 前端流程建议：先上传文件 -> 获取 URL -> 把 URL 保存到 tenant 的对应字段 -> 保存/更新 tenant

---

## 校验与约束
- logo/seal/signature 文件类型必须为 PNG（服务器端再次校验）
- name 和 code 为必填项
- templates[].codeFormat 为格式模板字符串，支持占位：{YYYY},{MM},{DD},{SEQ:n}

---

## 错误码建议
- 400 参数校验错误，返回 { code:400, message: '参数错误', details: {...} }
- 401 未授权
- 403 禁止访问
- 404 资源不存在
- 500 服务器错误

---

## 对接注意事项
- 推荐后端返回标准化的 JSON 结构（例如 { code:0, data:..., message:'' } 或直接返回资源 JSON 并在请求封装中适配）。前端当前 request 封装会将非 0/200 的 code 视为错误。
- 若后端支持文件上传，请使用上传接口以减小 JSON payload 并获得更稳定的文件存储。

---

如需我把这些 API 转为 OpenAPI 3.0 YAML，我可以接着生成 `docs/api/tenants-openapi.yaml`（包含 /tenants CRUD 与 /uploads）。