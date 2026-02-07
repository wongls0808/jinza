/* 全局异常兜底，防止进程崩溃 */
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

const http = require("http");
const fs = require("fs");
const path = require("path");

let getEntity, entities, syncAll, syncEntity, setRuntimeConfig, db;
try {
  ({ getEntity, entities } = require("./sync/entities"));
  ({ syncAll, syncEntity } = require("./sync/run"));
  ({ setRuntimeConfig } = require("./config"));
  db = require("./db");
  console.log("All modules loaded successfully.");
} catch (err) {
  console.error("Module load error:", err.message);
  /* 提供空实现，确保服务器能启动 */
  getEntity = () => null;
  entities = [];
  syncAll = async () => {};
  syncEntity = async () => {};
  setRuntimeConfig = () => {};
  db = {
    initTables: async () => {},
    isDbAvailable: () => false,
    getAllSyncData: async () => ({}),
    getSyncState: async () => ({}),
    getAllPurchasePI: async () => [],
    getConfig: async () => null,
    setConfig: async () => {},
    setSyncData: async () => {},
    setSyncState: async () => {},
    getSyncData: async () => [],
    addPurchasePI: async () => {},
    deletePurchasePI: async () => {}
  };
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
console.log(`PORT=${PORT}, DATABASE_URL=${process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.substring(0, 30) + "...)" : "NOT SET"}`);

/* ────── MIME ────── */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".b64": "text/plain; charset=utf-8"
};

/* ────── 工具函数 ────── */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Key-ID, API-Key"
  });
  res.end(body);
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 10 * 1024 * 1024) {
        reject(new Error("请求体过大"));
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error("JSON 解析失败"));
      }
    });
  });
}

function updateRuntimeConfig(body, headers) {
  setRuntimeConfig({
    baseUrl: body.baseUrl || process.env.AUTOCOUNT_BASE_URL,
    accountBookId: body.accountBookId || process.env.AUTOCOUNT_ACCOUNT_BOOK_ID,
    keyId: body.keyId || headers["key-id"] || process.env.AUTOCOUNT_KEY_ID,
    apiKey: body.apiKey || headers["api-key"] || process.env.AUTOCOUNT_API_KEY
  });
}

/* ────── 静态文件服务 ────── */
const WEB_ROOT = path.join(__dirname, "..", "web");

function serveStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/" || urlPath === "") {
    urlPath = "/index.html";
  }
  const filePath = path.join(WEB_ROOT, urlPath);
  /* 安全检查：防止路径穿越 */
  if (!filePath.startsWith(WEB_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return true; /* 已处理，不要再 fallback */
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false; /* 文件不存在，交给 API 路由 */
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache"
  });
  res.end(content);
  return true;
}

/* ────── API 路由 ────── */
async function handleApi(req, res) {
  const url = req.url.split("?")[0];

  /* CORS */
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Key-ID, API-Key"
    });
    res.end();
    return;
  }

  /* ── 健康检查 ── */
  if (url === "/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, db: db.isDbAvailable(), ts: new Date().toISOString() });
    return;
  }

  /* 数据库可用性检查（数据相关 API 需要数据库） */
  const dbRequired = url.startsWith("/api/data/") || url === "/api/config" || url === "/api/syncstate" || url === "/api/pi" || url.startsWith("/api/pi/");
  if (dbRequired && !db.isDbAvailable()) {
    sendJson(res, 503, { ok: false, error: "数据库未连接" });
    return;
  }

  /* ── 加载全部数据（前端启动时调用） ── */
  if (url === "/api/data/all" && req.method === "GET") {
    const [syncData, syncState, piList, config] = await Promise.all([
      db.getAllSyncData(),
      db.getSyncState(),
      db.getAllPurchasePI(),
      db.getConfig("autocount")
    ]);
    sendJson(res, 200, {
      ok: true,
      data: syncData,
      syncState,
      purchasePI: piList,
      config: config || null
    });
    return;
  }

  /* ── 保存配置 ── */
  if (url === "/api/config" && req.method === "POST") {
    const body = await collectBody(req);
    await db.setConfig("autocount", body);
    sendJson(res, 200, { ok: true });
    return;
  }

  /* ── 获取配置 ── */
  if (url === "/api/config" && req.method === "GET") {
    const config = await db.getConfig("autocount");
    sendJson(res, 200, { ok: true, config: config || null });
    return;
  }

  /* ── 保存同步数据（单实体） ── */
  if (url === "/api/data/sync" && req.method === "POST") {
    const body = await collectBody(req);
    const { entity, items, lastSync } = body;
    if (!entity) {
      sendJson(res, 400, { ok: false, error: "缺少 entity" });
      return;
    }
    await db.setSyncData(entity, items || []);
    if (lastSync) {
      await db.setSyncState(entity, lastSync);
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  /* ── 获取同步数据（单实体） ── */
  if (url.startsWith("/api/data/sync/") && req.method === "GET") {
    const entity = url.replace("/api/data/sync/", "");
    const items = await db.getSyncData(entity);
    sendJson(res, 200, { ok: true, items });
    return;
  }

  /* ── 保存同步状态 ── */
  if (url === "/api/syncstate" && req.method === "POST") {
    const body = await collectBody(req);
    const { entity, lastSync, meta } = body;
    if (!entity) {
      sendJson(res, 400, { ok: false, error: "缺少 entity" });
      return;
    }
    await db.setSyncState(entity, lastSync || null, meta || {});
    sendJson(res, 200, { ok: true });
    return;
  }

  /* ── PI 管理 ── */
  if (url === "/api/pi" && req.method === "GET") {
    const list = await db.getAllPurchasePI();
    sendJson(res, 200, { ok: true, items: list });
    return;
  }

  if (url === "/api/pi" && req.method === "POST") {
    const body = await collectBody(req);
    const docNo = body.docNo || (body.master && body.master.docNo) || "";
    if (!docNo) {
      sendJson(res, 400, { ok: false, error: "缺少 docNo" });
      return;
    }
    await db.addPurchasePI(docNo, body);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.startsWith("/api/pi/") && req.method === "DELETE") {
    const docNo = decodeURIComponent(url.replace("/api/pi/", ""));
    await db.deletePurchasePI(docNo);
    sendJson(res, 200, { ok: true });
    return;
  }

  /* ── AutoCount 代理 ── */
  if (url === "/api/proxy" && req.method === "POST") {
    const payload = await collectBody(req);
    updateRuntimeConfig(payload, req.headers);
    const { request } = require("./autocount/client");
    const { method, path: apiPath, query, body } = payload;
    const result = await request({ method, path: apiPath, query, body });
    sendJson(res, 200, result);
    return;
  }

  /* ── Ping ── */
  if (url === "/api/ping" && req.method === "POST") {
    const payload = await collectBody(req);
    updateRuntimeConfig(payload, req.headers);
    await syncEntity(getEntity("companyProfile"));
    sendJson(res, 200, { ok: true });
    return;
  }

  /* ── 后端同步 ── */
  if (url === "/api/sync" && req.method === "POST") {
    const payload = await collectBody(req);
    updateRuntimeConfig(payload, req.headers);
    const target = payload.entity;
    const entity = getEntity(target);
    if (!entity) {
      sendJson(res, 400, { ok: false, error: "未知实体" });
      return;
    }
    await syncEntity(entity);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url === "/api/sync-all" && req.method === "POST") {
    const payload = await collectBody(req);
    updateRuntimeConfig(payload, req.headers);
    await syncAll(entities);
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { ok: false, error: "Not Found" });
}

/* ────── 主服务器 ────── */
const server = http.createServer(async (req, res) => {
  try {
    /* 优先处理 API */
    if (req.url.startsWith("/api/") || req.url === "/health") {
      await handleApi(req, res);
      return;
    }
    /* CORS preflight for any path */
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Key-ID, API-Key"
      });
      res.end();
      return;
    }
    /* 静态文件 */
    const served = serveStatic(req, res);
    if (!served) {
      /* SPA fallback: 返回 index.html */
      const indexPath = path.join(WEB_ROOT, "index.html");
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    }
  } catch (error) {
    console.error("Request error:", error);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, error: error.message || "服务错误" });
    }
  }
});

/* ────── 启动 ────── */
/* 先监听端口（让健康检查尽快通过），再异步连接数据库 */
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  /* 异步初始化数据库，不阻塞端口监听 */
  db.initTables()
    .then(() => console.log("Database connected and tables ready."))
    .catch((err) => {
      console.error("Database init failed:", err.message);
      console.log("Server running without database persistence.");
    });
});
