/* ─────────────────────────────────────────────
 * IMAP 模块：登录发信邮箱收件箱，搜索对应 PO 的往来邮件，
 * 用于"回复式"发送 PI（写入 In-Reply-To / References 串成同一线程）。
 * 授权码与 SMTP 通用，IMAP 服务器按发件账号域名自动推断。
 * ───────────────────────────────────────────── */
const { ImapFlow } = require("imapflow");

/* 根据发件账号 / SMTP 主机推断 IMAP 服务器 */
function inferImap(user, smtpHost) {
  const u = String(user || "").toLowerCase();
  const h = String(smtpHost || "").toLowerCase();
  if (u.includes("@gmail.com") || h.includes("gmail")) return { host: "imap.gmail.com", port: 993, secure: true };
  if (u.includes("@yeah.net") || h.includes("yeah")) return { host: "imap.yeah.net", port: 993, secure: true };
  if (u.includes("@163.com") || h.includes("163")) return { host: "imap.163.com", port: 993, secure: true };
  if (u.includes("@qq.com") || h.includes("qq.com")) return { host: "imap.qq.com", port: 993, secure: true };
  if (u.includes("@outlook") || u.includes("@hotmail") || h.includes("outlook") || h.includes("office365") || h.includes("hotmail")) return { host: "outlook.office365.com", port: 993, secure: true };
  return { host: "", port: 993, secure: true };
}

/* 去掉主题前缀 Re: / Fwd: / 回复 / 答复 等 */
function stripThreadPrefix(subject) {
  return String(subject || "").replace(/^(\s*(re|fw|fwd|回复|答复)\s*[:：]\s*)+/i, "").trim();
}

/* 回复式主题：Re: + 原主题（去重已有 Re:） */
function replySubject(subject) {
  const base = stripThreadPrefix(subject);
  return base ? "Re: " + base : "";
}

/* 在收件箱搜索主题包含 token 的邮件，返回最新一封的线程信息。
 * smtp: {user, pass, host}；token: PO 号（如 PO-2607-079）
 * 返回 { subject, messageId, inReplyTo, references }；找不到返回 null */
async function findThreadMail(smtp, token) {
  const user = String((smtp && smtp.user) || "").trim();
  const pass = String((smtp && smtp.pass) || "");
  if (!user || !pass) throw new Error("缺少发件账号/授权码（IMAP 复用 SMTP 凭据）");
  const tok = String(token || "").trim();
  if (!tok) throw new Error("缺少 PO 号");
  const imap = inferImap(user, smtp && smtp.host);
  if (!imap.host) throw new Error("无法推断该邮箱的 IMAP 服务器: " + user);

  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: imap.secure,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });
  client.on("error", () => {}); /* 处理 error 事件，避免 unhandled error 崩溃 */
  try {
    await client.connect();
  } catch (e) {
    throw new Error("IMAP 连接失败（" + imap.host + "）: " + (e && e.message ? e.message : (e && e.code ? e.code : "未知错误")));
  }
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const matches = [];
      const collect = (msg) => {
        const subj = (msg.envelope && msg.envelope.subject) || "";
        if (subj.toLowerCase().indexOf(tok.toLowerCase()) < 0) return;
        matches.push({ uid: Number(msg.uid) || 0, envelope: msg.envelope, headers: msg.headers });
      };
      /* 优先 SUBJECT 搜索（gmail/yeah 等支持）；163 等服务器 SUBJECT 搜索不可靠（返回空或抛错），回退全量过滤 */
      try {
        for await (const msg of client.fetch({ subject: tok }, { uid: true, envelope: true, headers: ["references", "in-reply-to"] })) {
          collect(msg);
        }
      } catch (e) {
        /* SUBJECT 搜索异常，走全量回退 */
      }
      if (matches.length === 0) {
        /* 全量回退：只取最近 300 封（163 等收件箱可能很大，避免全量 fetch 超时） */
        let uids = [];
        try { uids = (await client.search({ all: true })) || []; } catch (e) { uids = []; }
        const recent = Array.isArray(uids) && uids.length ? uids.slice(-300) : null;
        if (recent && recent.length) {
          for await (const msg of client.fetch(recent, { uid: true, envelope: true, headers: ["references", "in-reply-to"] })) {
            collect(msg);
          }
        }
      }
      if (matches.length === 0) return null;
      matches.sort((a, b) => b.uid - a.uid);
      const pick = matches[0];
      const messageId = (pick.envelope && pick.envelope.messageId) || "";
      const subject = (pick.envelope && pick.envelope.subject) || "";
      const inReplyTo = (pick.envelope && pick.envelope.inReplyTo) || "";
      let references = "";
      if (pick.headers && typeof pick.headers.get === "function") references = pick.headers.get("references") || "";
      if (!references && inReplyTo) references = inReplyTo;
      const refs = (references ? String(references).split(/\s+/) : [])
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s) => s !== messageId);
      refs.push(messageId);
      return {
        subject: replySubject(subject),
        messageId: messageId,
        inReplyTo: messageId,
        references: refs.join(" ")
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

module.exports = { findThreadMail, inferImap, replySubject, stripThreadPrefix };