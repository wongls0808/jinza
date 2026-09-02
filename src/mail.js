/* ─────────────────────────────────────────────
 * 邮件发送模块（PI 邮件功能）
 * 全部配置存于 app_config(key='mail')，前端系统设置可增改：
 *  smtp {preset,host,port,secure,user,pass,fromName}
 *  to / cc / bcc 收件人(可用 , ; 或换行分隔多条)
 *  replyMode: 'pi'(默认,回给 PI 的供应商邮箱) | 'fixed'
 *  replyToFixed / bodyTemplate(占位符文本模板)
 * ───────────────────────────────────────────── */
const nodemailer = require("nodemailer");
const db = require("./db");

const PRESETS = {
  hotmail: { host: "smtp-mail.outlook.com", port: 587, secure: false },
  outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false },
  gmail: { host: "smtp.gmail.com", port: 465, secure: true },
  yeahnet: { host: "smtp.yeah.net", port: 465, secure: true },
  qq: { host: "smtp.qq.com", port: 465, secure: true },
  mail163: { host: "smtp.163.com", port: 465, secure: true }
};

const DEFAULT_TEMPLATE = [
  "Dear Sir/Madam,",
  "",
  "Please find attached the Proforma Invoice for your reference.",
  "",
  "PI No : {docNo}",
  "Date  : {docDate}",
  "Total : {currencyCode} {piTotal}",
  "Valid until : {validityDate}",
  "",
  "Supplier: {creditorName}",
  "Attention: {attention}",
  "Reference PO: {referencePoNo}",
  "",
  "Should you have any questions, please do not hesitate to contact us.",
  "",
  "Best regards,"
].join("\n");

function normalizeAddressList(value) {
  if (!value) return [];
  return String(value)
    .split(/[;,，；\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getMailConfig() {
  const stored = await db.getConfig("mail");
  const cfg = stored && typeof stored === "object" ? stored : {};
  return {
    smtp: { preset: "", host: "", port: 587, secure: false, user: "", pass: "", fromName: "AutoCount PI" },
    to: "",
    cc: "",
    bcc: "",
    replyMode: "pi",
    replyToFixed: "",
    bodyTemplate: DEFAULT_TEMPLATE,
    supplierRules: [],
    attachStyle: "server",
    ...cfg,
    supplierRules: Array.isArray(cfg.supplierRules) ? cfg.supplierRules : [],
    smtp: { preset: "", host: "", port: 587, secure: false, user: "", pass: "", fromName: "AutoCount PI", ...(cfg.smtp || {}) }
  };
}

async function saveMailConfig(cfg) {
  const existing = await getMailConfig();
  const merged = {
    smtp: { ...existing.smtp, ...(cfg && cfg.smtp ? cfg.smtp : {}) },
    to: cfg && typeof cfg.to === "string" ? cfg.to : existing.to,
    cc: cfg && typeof cfg.cc === "string" ? cfg.cc : existing.cc,
    bcc: cfg && typeof cfg.bcc === "string" ? cfg.bcc : existing.bcc,
    replyMode: cfg && cfg.replyMode ? cfg.replyMode : existing.replyMode,
    replyToFixed: cfg && typeof cfg.replyToFixed === "string" ? cfg.replyToFixed : existing.replyToFixed,
    bodyTemplate: cfg && typeof cfg.bodyTemplate === "string" ? cfg.bodyTemplate : existing.bodyTemplate,
    attachStyle: cfg && (cfg.attachStyle === "print" || cfg.attachStyle === "server") ? cfg.attachStyle : (existing.attachStyle || "server"),
    supplierRules: cfg && Array.isArray(cfg.supplierRules) ? cfg.supplierRules : existing.supplierRules
  };
  /* 密码为空串表示“保持不变” */
  if (merged.smtp.pass === "") merged.smtp.pass = existing.smtp.pass || "";
  await db.setConfig("mail", merged);
  return merged;
}

/* 发送一封邮件。opts: {to, cc, bcc, subject, text, html, replyTo, fromName, attachments:[{filename, base64, contentType}]} */
async function sendMail(opts) {
  const cfg = await getMailConfig();
  const s = cfg.smtp || {};
  if (!s.host || !s.user) throw new Error("邮件未配置: 请先在系统设置中填写 SMTP 服务器与发件账号");
  if (!s.pass) throw new Error("邮件未配置: 缺少 SMTP 授权码/密码");
  const to = normalizeAddressList(opts.to || cfg.to);
  if (to.length === 0) throw new Error("缺少收件人(To)");

  const transporter = nodemailer.createTransport({
    host: s.host,
    port: Number(s.port) || 587,
    secure: s.secure === true || Number(s.port) === 465,
    auth: { user: s.user, pass: s.pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });

  const attachments = Array.isArray(opts.attachments) && opts.attachments.length
    ? opts.attachments.map((a) => ({
        filename: a.filename || "attachment.pdf",
        content: Buffer.from(String(a.base64 || a.content || ""), "base64"),
        contentType: a.contentType || "application/pdf"
      }))
    : undefined;

  let replyTo = opts.replyTo || undefined;
  if (!replyTo && cfg.replyMode === "fixed" && cfg.replyToFixed) {
    replyTo = normalizeAddressList(cfg.replyToFixed)[0];
  }

  const info = await transporter.sendMail({
    from: {
      name: opts.fromName || s.fromName || s.user.split("@")[0] || "AutoCount",
      address: s.user
    },
    to: to.join(", "),
    cc: opts.cc || normalizeAddressList(cfg.cc).join(", ") || undefined,
    bcc: normalizeAddressList(cfg.bcc).join(", ") || undefined,
    subject: opts.subject || "Proforma Invoice",
    text: opts.text || "",
    html: opts.html || undefined,
    replyTo: replyTo || undefined,
    attachments
  });
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

/* 把 PI 对象填入文本模板占位符 */
function fillTemplate(template, vars) {
  const v = vars || {};
  return String(template || DEFAULT_TEMPLATE).replace(/\{([a-zA-Z0-9_]+)\}/g, (m, key) => {
    const val = v[key];
    return val === undefined || val === null ? "" : String(val);
  });
}

module.exports = { PRESETS, DEFAULT_TEMPLATE, getMailConfig, saveMailConfig, sendMail, normalizeAddressList, fillTemplate };
