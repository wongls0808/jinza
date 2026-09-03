/* PI PDF 附件生成（服务端 pdfkit）
 * 供邮件发送使用：按 PI 数据渲染 A4 版式，支持中文字体与印章。
 */
const path = require("path");
const PDFDocument = require("pdfkit");

const FONT = path.join(__dirname, "..", "assets", "fonts", "NotoSansCJKsc-Regular.otf");

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function fmt(n) {
  const v = Math.round(num(n) * 100) / 100;
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pick(obj, keys) {
  if (!obj) return "";
  for (const k of keys) { const v = obj[k]; if (v !== undefined && v !== null && String(v).trim() !== "") return v; }
  return "";
}
function shortDate(v) {
  if (!v) return "";
  const s = String(v);
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s.slice(0, 10);
}
function money(v) { const n = num(v); return Math.round(n * 100) / 100; }

const DEFAULT_BUYER = {
  name: "JINZA TRADING SDN. BHD.",
  reg: "Reg. No.: 202501024394 (1625807-K) | TIN: C60122406100",
  address: "2nd Floor, No. 185\nJalan Datuk Abang Abdul Rahim,\n93450 Kuching, Sarawak, Malaysia",
  tel: "Tel / Mobile: 018-2556898",
  email: "E-mail: jinza.sb@gmail.com"
};

const FALLBACK_BANKS = [
  { label: "Bank Account 1", accountNumber: "88800021380472790", accountName: "PUTIAN GUSHU TRADING CO.,LTD.", bankName: "OCBC BANK (MALAYSIA) BERHAD", country: "Malaysia" },
  { label: "Bank Account 2", accountNumber: "00181100000015449", accountName: "Alipay Malaysia", bankName: "HSBC BANK MALAYSIA BERHAD", country: "Malaysia" }
];

function safeFilename(name) {
  return String(name || "PI").replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 80);
}

function buildPage({ doc, rec, pi, details, currency, totalText, validity, banks, stampSrc, pageNo, pageCount, buyer }) {
  const M = 36, W = doc.page.width - M * 2;
  let y = M;

  doc.font("chinese").fontSize(16).fillColor("#111");
  doc.text("PROFORMA INVOICE", M, y, { align: "center", width: W });
  y += 20;
  doc.moveTo(M, y).lineTo(M + W, y).strokeColor("#111").lineWidth(1).stroke();
  y += 6;

  const b = buyer || DEFAULT_BUYER;
  const buyerName = b.name;
  const seller = pick(rec, ["creditorName", "companyName"]) || "-";
  doc.fontSize(11).fillColor("#111");
  doc.text(buyerName, M, y);
  doc.fontSize(8.5).fillColor("#333");
  doc.text(b.reg, M, y + 13);
  doc.text("Buyer (Bill To)", M + W - 150, y, { width: 150, align: "right" });
  doc.text(buyerName, M + W - 150, y + 13, { width: 150, align: "right" });
  y += 34;

  doc.fontSize(11).fillColor("#111").text("Seller / Exporter", M, y);
  doc.fontSize(8.5).fillColor("#333");
  doc.text(seller, M + 110, y, { width: W - 110 });
  doc.fontSize(11).fillColor("#111");
  doc.text("PI No.", M + W - 150, y, { width: 150, align: "right" });
  doc.fontSize(10).text(pick(pi, ["docNo"]) || pick(rec, ["docNo"]) || "-", M + W - 150, y + 14, { width: 150, align: "right" });
  y += 30;

  const supplierAddr = pick(rec, ["address", "deliverAddress"]) || "-";
  doc.fontSize(8.5).fillColor("#333");
  doc.text(String(supplierAddr), M + 110, y, { width: W - 260 });
  doc.fontSize(10).fillColor("#111");
  const dt = shortDate(pick(pi, ["docDate"]) || pick(rec, ["docDate"])) || "-";
  doc.text("Date: " + dt, M + W - 150, y, { width: 150, align: "right" });
  y += (supplierAddr.split("\n").length * 11) + 8;
  const attn = pick(rec, ["attention"]) || "-";
  const phone = pick(rec, ["phone1", "deliverPhone1"]) || "-";
  doc.fontSize(8.5).fillColor("#333").text("Attention: " + attn + "    Tel: " + phone, M, y);
  const vdate = shortDate(pick(pi, ["validityDate"])) || "-";
  doc.fontSize(10).fillColor("#111").text("Validity: " + vdate, M + W - 150, y, { width: 150, align: "right" });
  y += 14;

  doc.moveTo(M, y).lineTo(M + W, y).strokeColor("#111").lineWidth(1).stroke();
  y += 6;

  /* 明细表头 */
  const col = { no: 30, qty: 52, unit: 52, price: 82, amount: 88 };
  const descW = W - col.no - col.qty - col.unit - col.price - col.amount;
  const drawHead = (yy) => {
    doc.font("chinese").fontSize(8).fillColor("#fff");
    doc.rect(M, yy, col.no, 16).fill("#111");
    doc.rect(M + col.no, yy, col.qty, 16).fill("#111");
    doc.rect(M + col.no + col.qty, yy, col.unit, 16).fill("#111");
    doc.rect(M + col.no + col.qty + col.unit, yy, descW, 16).fill("#111");
    doc.rect(M + col.no + col.qty + col.unit + descW, yy, col.price, 16).fill("#111");
    doc.rect(M + W - col.amount, yy, col.amount, 16).fill("#111");
    doc.fillColor("#fff").fontSize(7.5);
    doc.text("No", M + 2, yy + 4, { width: col.no - 4 });
    doc.text("Qty", M + col.no + 2, yy + 4, { width: col.qty - 4, align: "right" });
    doc.text("Unit", M + col.no + col.qty + 2, yy + 4, { width: col.unit - 4 });
    doc.text("Description", M + col.no + col.qty + col.unit + 2, yy + 4, { width: descW - 4 });
    doc.text("Unit Price", M + col.no + col.qty + col.unit + descW + 2, yy + 4, { width: col.price - 4, align: "right" });
    doc.text("Amount", M + W - col.amount + 2, yy + 4, { width: col.amount - 4, align: "right" });
    return yy + 16;
  };
  y = drawHead(y);

  const detailsArr = Array.isArray(details) ? details : [];
  const maxRows = Math.max(1, Math.floor((doc.page.height - y - 150) / 17));
  detailsArr.forEach((d, i) => {
    if (i > 0 && i % maxRows === 0) {
      doc.addPage();
      y = M;
      y = drawHead(y);
    }
    const desc = pick(d, ["description", "itemName", "productCode"]) || "-";
    const qty = pick(d, ["qty", "quantity"]);
    const unit = pick(d, ["unit", "unitType"]) || "";
    const price = pick(d, ["unitPrice", "price"]);
    const amount = pick(d, ["amount", "subtotal", "lineTotal"]);
    const amt = fmt(amount !== "" ? amount : (num(qty) * num(price)));
    doc.fontSize(8).fillColor("#111");
    doc.text(String(i + 1), M + 2, y + 2, { width: col.no - 4 });
    doc.text(String(qty), M + col.no + 2, y + 2, { width: col.qty - 4, align: "right" });
    doc.text(String(unit), M + col.no + col.qty + 2, y + 2, { width: col.unit - 4 });
    doc.text(String(desc), M + col.no + col.qty + col.unit + 2, y + 2, { width: descW - 4 });
    doc.text(fmt(price), M + col.no + col.qty + col.unit + descW + 2, y + 2, { width: col.price - 4, align: "right" });
    doc.text(amt, M + W - col.amount + 2, y + 2, { width: col.amount - 4, align: "right" });
    y += 17;
  });
  doc.moveTo(M, y).lineTo(M + W, y).strokeColor("#111").lineWidth(1).stroke();
  y += 8;

  /* 合计 */
  doc.fontSize(11).fillColor("#111");
  doc.text("TOTAL (" + currency + "): " + totalText, M + W - col.amount, y, { width: col.amount, align: "right" });
  y += 16;

  /* 银行信息 */
  doc.fontSize(8.5).fillColor("#111").text("Payment Details:", M, y);
  y += 12;
  (Array.isArray(banks) && banks.length ? banks : []).forEach((b) => {
    doc.fontSize(8).fillColor("#222");
    doc.text((b.label || "Bank Account") + ":", M, y);
    doc.text("Account Number : " + (b.accountNumber || "-"), M + 150, y);
    doc.text("Account Name : " + (b.accountName || "-"), M + 150, y + 11);
    doc.text("Bank : " + (b.bankName || "-"), M + 150, y + 22);
    y += 38;
  });

  /* 印章 */
  if (stampSrc && stampSrc.startsWith("data:image/")) {
    try { doc.image(stampSrc, W - 150 + M, doc.page.height - 150, { width: 120 }); } catch (e) { /* 印章异常忽略 */ }
  }

  /* 备注与页脚 */
  doc.fontSize(8).fillColor("#444");
  doc.text(
    "Remarks: This PI is issued for order confirmation and payment arrangement purposes only.\n" +
    "Delivery shall be arranged by Seller under DDP terms based on Buyer's designated delivery location.",
    M, doc.page.height - 96, { width: W - 160 }
  );
  doc.fontSize(7).fillColor("#777").text(
    "Page " + pageNo + " of " + pageCount + "    " + seller,
    M, doc.page.height - 34, { width: W, align: "center" }
  );
}

/* 渲染单张 PI 的 PDF，返回 Buffer */
function renderPiPdf(pi, profile, buyer) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 36, autoFirstPage: false, bufferPages: true });
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.registerFont("chinese", FONT);
      doc.addPage();

      const rec = (pi && pi.master) || pi || {};
      const details = Array.isArray(pi && pi.details) ? pi.details : [];
      const currency = pick(rec, ["currencyCode"]) || pick(pi, ["currencyCode"]) || "MYR";
      const totalAmount = money(pick(pi, ["piTotal", "total"]) !== "" ? pick(pi, ["piTotal", "total"]) : rec.piTotal || rec.total || calcTotal(details));
      const totalText = fmt(totalAmount);
      const validity = pick(pi, ["validityDate"]);
      const stampSrc = (profile && profile.stampDataUrl) || "";
      const banks = (profile && Array.isArray(profile.banks) && profile.banks.length) ? profile.banks : FALLBACK_BANKS;

      const totalPages = Math.max(1, Math.ceil((details.length || 1) / Math.max(1, Math.floor((doc.page.height - 72 - 150) / 17))));
      const bufPages = [];
      // 简化：直接单 doc 渲染，多页由 buildPage 自动 addPage
      buildPage({ doc, rec, pi, details, currency, totalText, validity, banks, stampSrc, pageNo: 1, pageCount: totalPages, buyer: buyer || DEFAULT_BUYER });

      doc.end();
    } catch (e) { reject(e); }
  });
}

function calcTotal(details) {
  return (details || []).reduce((s, d) => s + num(d.qty) * num(d.unitPrice), 0);
}

module.exports = { renderPiPdf, safeFilename, calcTotal, FALLBACK_BANKS, DEFAULT_BUYER };
