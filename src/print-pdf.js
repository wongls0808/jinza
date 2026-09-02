/* 打印引擎：用无头 Chromium 模拟浏览器打印生成 PDF（与"打印→另存为 PDF"一致） */
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
      /* 模拟浏览器打印对话框的默认页边距 */
      margin: opts && opts.margin
        ? opts.margin
        : { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      preferCSSPageSize: false
    });
    return pdf; /* Buffer */
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

module.exports = { pdfFromHtml, closeBrowser, getBrowser };
