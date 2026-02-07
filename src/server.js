const http = require("http");
const { getEntity, entities } = require("./sync/entities");
const { syncAll, syncEntity } = require("./sync/run");
const { setRuntimeConfig } = require("./config");

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Key-ID, API-Key"
  });
  res.end(body);
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
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

const server = http.createServer(async (req, res) => {
  // 添加健康检查端点
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { 
      ok: true, 
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "0.1.0"
    });
    return;
  }

  // 添加根路径响应
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AutoCount Sync Service</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .card { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>AutoCount Sync Service</h1>
            <div class="card">
              <h2>API Endpoints</h2>
              <ul>
                <li><strong>GET /health</strong> - 健康检查</li>
                <li><strong>POST /api/ping</strong> - 测试AutoCount连接</li>
                <li><strong>POST /api/sync</strong> - 同步指定实体</li>
                <li><strong>POST /api/sync-all</strong> - 同步所有实体</li>
                <li><strong>POST /api/proxy</strong> - AutoCount API代理</li>
              </ul>
            </div>
            <div class="card">
              <h2>Web Interface</h2>
              <p>访问 <a href="/web/index.html">/web/index.html</a> 使用完整Web界面</p>
            </div>
          </div>
        </body>
      </html>
    `);
    return;
  }

  // 静态文件服务 - 提供web目录访问
  if (req.method === "GET" && req.url.startsWith("/web/")) {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "..", req.url);
    
    try {
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".svg": "image/svg+xml"
        }[ext] || "text/plain";

        const content = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } else {
        res.writeHead(404);
        res.end("File not found");
      }
    } catch (error) {
      res.writeHead(500);
      res.end("Server error");
    }
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Key-ID, API-Key"
    });
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method Not Allowed" });
    return;
  }

  try {
    const payload = await collectBody(req);
    updateRuntimeConfig(payload, req.headers);

    if (req.url === "/api/ping") {
      await syncEntity(getEntity("companyProfile"));
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.url === "/api/proxy") {
      const { request } = require("./autocount/client");
      const { method, path, query, body } = payload;
      const result = await request({ method, path, query, body });
      sendJson(res, 200, result);
      return;
    }

    if (req.url === "/api/sync") {
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

    if (req.url === "/api/sync-all") {
      await syncAll(entities);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { ok: false, error: "Not Found" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || "服务错误" });
  }
});

server.listen(PORT, () => {
  console.log(`Sync server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Web interface: http://localhost:${PORT}/web/index.html`);
});
