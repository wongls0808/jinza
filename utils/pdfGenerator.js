/**
 * PDF生成工具
 */
import puppeteer from 'puppeteer';

/**
 * 根据HTML内容生成PDF
 * @param {string} html HTML内容
 * @param {Object} options PDF生成选项
 * @returns {Promise<Buffer>} 生成的PDF数据
 */
export async function generatePDF(html, options = {}) {
  let browser = null;
  
  try {
    // 使用puppeteer启动无头浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // 创建新页面
    const page = await browser.newPage();
    
    // 设置内容
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // 设置PDF选项
    const pdfOptions = {
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    };
    
    // 生成PDF
    const pdf = await page.pdf(pdfOptions);
    
    return pdf;
  } catch (error) {
    console.error('生成PDF失败:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ES模块导出已在函数声明处完成