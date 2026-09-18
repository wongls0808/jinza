/* 打印引擎：用无头 Chromium 模拟浏览器打印生成 PDF（与"打印→另存为 PDF"一致） */
const { PDFDocument } = require("pdf-lib");
let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const puppeteer = require("puppeteer");
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"]
      });
      browser.on("disconnected", () => { browserPromise = null; });
      return browser;
    })();
    browserPromise.catch(() => { browserPromise = null; });
  }
  return browserPromise;
}

async function pdfFromHtml(html, opts) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(String(html || ""), { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 250));
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: opts && opts.margin ? opts.margin : { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: '<div style="font-size:9px; width:100%; text-align:right; padding-right:10mm; color:#666;">Page <span class="pageNumber"></span></div>'
    });
    return pdf; /* Buffer */
  } finally {
    await page.close().catch(() => {});
  }
}

/* 分别渲染多份独立 HTML 文档 → 各自 PDF → 合并为一个 PDF 文件包。
 * 每份文档独立分页、独立页码；SC(最后一份)可用 footer 显示 Page X / Y。
 * htmls: ["html1", { html: "scHtml", footer: true }, ...] */
async function pdfFromHtmlPack(htmls, opts) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const list = Array.isArray(htmls) ? htmls : [];
    if (list.length === 0) throw new Error("pdfFromHtmlPack: 缺少 HTML");
    const pdfs = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const html = typeof item === "string" ? item : item.html;
      const footer = typeof item === "string" ? false : !!item.footer;
      await page.setContent(String(html || ""), { waitUntil: "networkidle0", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 200));
      const buf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: (opts && opts.margin) ? opts.margin : { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
        preferCSSPageSize: false,
        displayHeaderFooter: footer,
        headerTemplate: "<div></div>",
        footerTemplate: '<div style="font-size:9px; width:100%; text-align:right; padding-right:10mm; color:#666;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></div>'
      });
      pdfs.push(buf);
    }
    /* 合并 PDF */
    const merged = await PDFDocument.create();
    for (const buf of pdfs) {
      const doc = await PDFDocument.load(buf);
      const copied = await merged.copyPages(doc, doc.getPageIndices());
      copied.forEach((pg) => merged.addPage(pg));
    }
    return Buffer.from(await merged.save());
  } finally {
    await page.close().catch(() => {});
  }
}

async function closeBrowser() {
  if (browserPromise) {
    try { const b = await browserPromise; await b.close(); } catch (e) {}
    browserPromise = null;
  }
}

module.exports = { pdfFromHtml, pdfFromHtmlPack, closeBrowser, getBrowser };
