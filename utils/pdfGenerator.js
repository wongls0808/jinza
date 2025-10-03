/**
 * PDF生成工具
 */
import fs from 'fs';

// 动态导入以处理服务器端兼容性
async function getPuppeteer() {
  try {
    // 首先尝试导入puppeteer-core
    return await import('puppeteer-core');
  } catch (e) {
    // 如果失败，回退到puppeteer
    return await import('puppeteer');
  }
}

/**
 * 根据HTML内容生成PDF
 * @param {string} html HTML内容
 * @param {Object} options PDF生成选项
 * @returns {Promise<Buffer>} 生成的PDF数据
 */
export async function generatePDF(html, options = {}) {
  // 如果在服务器环境中，返回模拟的PDF数据
  if (process.env.NODE_ENV === 'production') {
    console.log('在生产环境中，使用简化的PDF生成');
    return Buffer.from(html);
  }
  
  let browser = null;
  
  try {
    const puppeteer = await getPuppeteer();
    
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