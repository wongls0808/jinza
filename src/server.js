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
const zlib = require("zlib");

let getEntity, entities, syncAll, syncEntity, setRuntimeConfig, db, mail, piPdf, printPdf, imap;
try {
  ({ getEntity, entities } = require("./sync/entities"));
  ({ syncAll, syncEntity } = require("./sync/run"));
  ({ setRuntimeConfig } = require("./config"));
  db = require("./db");
  mail = require("./mail");
  imap = require("./imap");
  piPdf = require("./pi-pdf");
  printPdf = require("./print-pdf");
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
const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
console.log(`PORT=${PORT}, DB=${dbUrl ? "set (" + dbUrl.replace(/\/\/[^@]*@/, "//***@") + ")" : "NOT SET (need DATABASE_URL or DATABASE_PUBLIC_URL)"}`);


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
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Key-ID, API-Key"
  };
  /* 大响应 gzip：全量数据接口(如 /api/data/all)可压缩到约 1/5，显著加快首次加载 */
  const accept = String((res.req && res.req.headers && res.req.headers["accept-encoding"]) || "");
  if (body.length > 2048 && accept.includes("gzip")) {
    zlib.gzip(body, (err, buf) => {
      if (err || !buf) {
        res.writeHead(status, headers);
        res.end(body);
        return;
      }
      headers["Content-Encoding"] = "gzip";
      res.writeHead(status, headers);
      res.end(buf);
    });
    return;
  }
  res.writeHead(status, headers);
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

  /* ── 健康检查（同时支持 /health 和 /api/health） ── */
  if ((url === "/health" || url === "/api/health") && req.method === "GET") {
    sendJson(res, 200, { ok: true, db: db.isDbAvailable(), ts: new Date().toISOString() });
    return;
  }

  /* 数据库可用性检查（数据相关 API 需要数据库） */
  const dbRequired = url.startsWith("/api/data/") || url === "/api/config" || url === "/api/syncstate" || url === "/api/pi" || url.startsWith("/api/pi/") || url === "/api/mail/config" || url === "/api/mail/test" || url === "/api/mail/send" || url === "/api/mail/send-pi";
  if (dbRequired && !db.isDbAvailable()) {
    sendJson(res, 503, { ok: false, error: "数据库未连接" });
    return;
  }

  /* ── 加载全部数据（前端启动时调用） ── */
  if (url === "/api/data/all" && req.method === "GET") {
    try {
      const [syncData, syncState, piList, config, sentEmails] = await Promise.all([
        db.getAllSyncData().catch((e) => { console.error("getAllSyncData error:", e.message); return {}; }),
        db.getSyncState().catch((e) => { console.error("getSyncState error:", e.message); return {}; }),
        db.getAllPurchasePI().catch((e) => { console.error("getAllPurchasePI error:", e.message); return []; }),
        db.getConfig("autocount").catch((e) => { console.error("getConfig error:", e.message); return null; }),
        db.listSentEmails().catch((e) => { console.error("listSentEmails error:", e.message); return {}; })
      ]);
      sendJson(res, 200, {
        ok: true,
        data: syncData || {},
        syncState: syncState || {},
        purchasePI: piList || [],
        config: config || null,
        sentEmails: sentEmails || {}
      });
    } catch (e) {
      console.error("/api/data/all fatal:", e.message);
      sendJson(res, 500, { ok: false, error: e.message });
    }
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

  /* ── 模拟浏览器打印生成 PDF（打印同款附件） ── */
  if (url === "/api/mail/html-pdf" && req.method === "POST") {
    try {
      const body = await collectBody(req);
      const html = body && typeof body.html === "string" ? body.html : "";
      if (!html) { sendJson(res, 400, { ok: false, error: "缺少 html" }); return; }
      const pdfBuf = Buffer.from(await printPdf.pdfFromHtml(html));
      sendJson(res, 200, { ok: true, bytes: pdfBuf.length, base64: pdfBuf.toString("base64") });
    } catch (e) {
      sendJson(res, 500, { ok: false, error: "打印引擎不可用: " + e.message });
    }
    return;
  }

  /* ── 邮件(PI 发送) ── */
  if (url === "/api/mail/config" && req.method === "GET") {
    try {
      const cfg = await mail.getMailConfig();
      const out = { ...cfg, smtp: { ...cfg.smtp, pass: cfg.smtp && cfg.smtp.pass ? "******" : "" } };
      sendJson(res, 200, { ok: true, config: out, presets: mail.PRESETS });
    } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
    return;
  }
  if (url === "/api/mail/config" && req.method === "POST") {
    try {
      const body = await collectBody(req);
      await mail.saveMailConfig(body.config || {});
      sendJson(res, 200, { ok: true });
    } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
    return;
  }
  if (url === "/api/mail/test" && req.method === "POST") {
    try {
      const body = await collectBody(req);
      if (body.config) await mail.saveMailConfig(body.config);
      const info = await mail.sendMail({ subject: "AutoCount 邮件配置测试", text: "这是一封来自 AutoCount 同步控制台的测试邮件。\n\n收到即表示 SMTP 配置正确。" });
      sendJson(res, 200, { ok: true, info });
    } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
    return;
  }
  if (url === "/api/mail/send" && req.method === "POST") {
    try {
      const body = await collectBody(req);
      if (!Array.isArray(body.emails) || body.emails.length === 0) {
        sendJson(res, 400, { ok: false, error: "缺少待发送邮件列表" });
        return;
      }
      const results = [];
      let okCount = 0;
      for (const em of body.emails) {
        try {
          const info = await mail.sendMail({ to: em.to, subject: em.subject, text: em.text, replyTo: em.replyTo, fromName: em.fromName, attachments: em.attachments });
          okCount++;
          results.push({ docNo: em.docNo, ok: true, messageId: info.messageId });
        } catch (e) { results.push({ docNo: em.docNo, ok: false, error: e.message }); }
      }
      sendJson(res, 200, { ok: true, sent: okCount, failed: results.length - okCount, results });
    } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
    return;
  }

  /* ── 邮件：批量发送 PI（固定收件人 + 各供应商抬头 / Reply-To + PDF 附件） ── */
  if (url === "/api/mail/send-pi" && req.method === "POST") {
    try {
      const body = await collectBody(req);
      const pis = Array.isArray(body.pis) ? body.pis : [];
      if (pis.length === 0) { sendJson(res, 400, { ok: false, error: "缺少待发送的 PI 列表" }); return; }
      const replyByInbox = body.replyByInbox === true;
      const cfg = await mail.getMailConfig();
      const ac = await db.getConfig("autocount");
      const fnum = (v) => { const n = Number(v); return Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""; };
      const sdate = (v) => { if (!v) return ""; const s = String(v); const m = s.match(/^\d{4}-\d{2}-\d{2}/); return m ? m[0] : s.slice(0, 10); };
      const results = [];
      let okCount = 0;
      for (const pi of pis) {
        try {
          const rec = (pi && pi.master) || pi || {};
          const docNo = pi.docNo || rec.docNo || "PI";
          const code = rec.creditorCode || "";
          const profile = (ac && ac.supplierPrintProfiles && ac.supplierPrintProfiles[code]) || null;
          const credName = rec.creditorName || "";
          const email = String(rec.email || "").split(/[,;，；\s]+/)[0].trim() || "";
          /* 按供应商关联规则：优先使用该供应商的收件/回复/发件名 */
          const rule = (Array.isArray(cfg.supplierRules) ? cfg.supplierRules : []).find((x) => x && String(x.supplierCode) === String(code));
          const ruleTo = (rule && rule.to) || "";
          const ruleReply = (rule && rule.replyTo) || "";
          const piTotal = pi.piTotal ?? pi.total ?? rec.piTotal ?? rec.total;
          const vars = {
            docNo,
            creditorName: credName,
            creditorCode: code,
            attention: rec.attention || "",
            docDate: sdate(rec.docDate || pi.docDate),
            currencyCode: rec.currencyCode || pi.currencyCode || "MYR",
            piTotal: fnum(piTotal),
            validityDate: sdate(pi.validityDate || rec.validityDate),
            referencePoNo: pi.referencePoNo || rec.ref || pi.sourcePONo || "",
            sourcePONo: pi.sourcePONo || rec.ref || "",
            ivCustomerName: pi.ivCustomerName || rec.ivCustomerName || ""
          };
          /* 供应商独立档案：模板/cc/bcc/发件账号均可隔离；缺省回退全局 */
          const ruleBody = rule && rule.bodyTemplate ? rule.bodyTemplate : "";
          const text = mail.fillTemplate(ruleBody || cfg.bodyTemplate, vars);
          const subject = docNo + (credName ? " - " + credName : "");
          /* 附件 PDF：print=用前端打印同款;server(默认)=服务端矢量 PDF(无放大) */
          const usePrint = body.usePrintPdf === true;
          const pre = body.pdfAttachments && body.pdfAttachments[docNo];
          let pdfBase64 = "";
          if (usePrint && pre && pre.base64) {
            pdfBase64 = String(pre.base64);
          } else {
            const pdf = await piPdf.renderPiPdf(pi, profile);
            pdfBase64 = pdf.toString("base64");
          }
          const ownSmtp = rule && rule.smtp && rule.smtp.user && rule.smtp.pass ? rule.smtp : null;
          /* 回复式发送：在发信邮箱收件箱查找对应 PO 的往来邮件并串成线程 */
          let threadSubject = subject;
          let inReplyTo, references;
          if (replyByInbox) {
            const sendSmtp = ownSmtp || (cfg && cfg.smtp) || {};
            const poToken = vars.sourcePONo || vars.referencePoNo || "";
            if (!poToken) {
              results.push({ docNo, ok: false, error: "回复模式：该 PI 无 PO 号，已取消（未标记发送）" });
              continue;
            }
            let thread = null;
            try {
              thread = await imap.findThreadMail(sendSmtp, poToken);
            } catch (e) {
              results.push({ docNo, ok: false, error: "回复模式：查找 PO 邮件失败（" + poToken + "）: " + e.message });
              continue;
            }
            if (!thread || !thread.messageId) {
              results.push({ docNo, ok: false, error: "回复模式：收件箱未找到主题含 " + poToken + " 的邮件，已取消（未标记发送）" });
              continue;
            }
            threadSubject = thread.subject || subject;
            inReplyTo = thread.inReplyTo;
            references = thread.references;
          }
          const info = await mail.sendMail({
            smtp: ownSmtp || undefined,
            to: (rule && rule.to) || undefined,
            cc: (rule && rule.cc) || undefined,
            bcc: (rule && rule.bcc) || undefined,
            subject: threadSubject,
            text,
            replyTo: (rule && rule.replyTo) || email || undefined,
            inReplyTo: inReplyTo || undefined,
            references: references || undefined,
            /* 发件抬头：独立账号用其显示名，否则用该 PI 供应商抬头 */
            fromName: (rule && rule.fromName) || credName || (ownSmtp && ownSmtp.fromName) || (cfg.smtp && cfg.smtp.fromName),
            attachments: [{ filename: piPdf.safeFilename(docNo) + ".pdf", base64: pdfBase64 }]
          });
          okCount++;
          results.push({ docNo, ok: true, messageId: info.messageId, to: info.accepted || [] });
          db.markEmailSent(docNo, code, info.messageId).catch(() => {});
        } catch (e) {
          results.push({ docNo: (pi && pi.docNo) || "?", ok: false, error: e.message });
        }
      }
      sendJson(res, 200, { ok: true, sent: okCount, failed: results.length - okCount, results });
    } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
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
      console.error("Database init failed:", err.message, err.code || "");
      if (err.message && err.message.includes("password authentication")) {
        console.error("提示: 密码认证失败，请检查 DATABASE_URL 或 DATABASE_PUBLIC_URL 中的密码是否正确。");
      }
      console.log("Server running without database persistence.");
    });
});
