/**
 * Jinza企业管理系统 - 浏览器兼容性测试脚本
 * 此脚本用于自动检测浏览器环境并验证关键UI组件的兼容性
 */

// 检测浏览器及设备信息
function detectBrowserAndDevice() {
  const userAgent = navigator.userAgent;
  const browserInfo = {};
  
  // 检测浏览器类型
  browserInfo.isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
  browserInfo.isFirefox = /Firefox/.test(userAgent);
  browserInfo.isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  browserInfo.isEdge = /Edg/.test(userAgent);
  browserInfo.isIE = /Trident/.test(userAgent);
  
  // 确定浏览器名称
  if (browserInfo.isChrome) browserInfo.name = 'Chrome';
  else if (browserInfo.isFirefox) browserInfo.name = 'Firefox';
  else if (browserInfo.isSafari) browserInfo.name = 'Safari';
  else if (browserInfo.isEdge) browserInfo.name = 'Edge';
  else if (browserInfo.isIE) browserInfo.name = 'Internet Explorer';
  else browserInfo.name = '未知浏览器';
  
  // 检测设备类型
  browserInfo.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  browserInfo.isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  browserInfo.isDesktop = !browserInfo.isMobile && !browserInfo.isTablet;
  
  // 检测操作系统
  if (/Windows/.test(userAgent)) browserInfo.os = 'Windows';
  else if (/Macintosh|Mac OS X/.test(userAgent)) browserInfo.os = 'macOS';
  else if (/Linux/.test(userAgent)) browserInfo.os = 'Linux';
  else if (/Android/.test(userAgent)) browserInfo.os = 'Android';
  else if (/iPhone|iPad|iPod/.test(userAgent)) browserInfo.os = 'iOS';
  else browserInfo.os = '未知操作系统';
  
  // 获取屏幕信息
  browserInfo.screenWidth = window.innerWidth;
  browserInfo.screenHeight = window.innerHeight;
  browserInfo.devicePixelRatio = window.devicePixelRatio || 1;
  
  // 确定设备类别
  if (browserInfo.screenWidth < 768) {
    browserInfo.deviceCategory = '手机';
  } else if (browserInfo.screenWidth < 1024) {
    browserInfo.deviceCategory = '平板';
  } else if (browserInfo.screenWidth < 1440) {
    browserInfo.deviceCategory = '笔记本';
  } else {
    browserInfo.deviceCategory = '桌面';
  }
  
  return browserInfo;
}

// 测试关键UI组件
function testUIComponents() {
  const results = {
    components: {},
    cssFeatures: {},
    overallStatus: 'pass'
  };
  
  // 测试CSS特性支持
  results.cssFeatures.flexbox = 'flex' in document.documentElement.style ? 'pass' : 'fail';
  results.cssFeatures.grid = 'grid' in document.documentElement.style ? 'pass' : 'fail';
  results.cssFeatures.cssVariables = window.CSS && CSS.supports('color', 'var(--test)') ? 'pass' : 'fail';
  results.cssFeatures.transitions = 'transition' in document.documentElement.style ? 'pass' : 'fail';
  
  // 检测关键组件渲染
  function checkElementRendering(selector, componentName) {
    const element = document.querySelector(selector);
    if (!element) {
      results.components[componentName] = 'not-found';
      results.overallStatus = 'warning';
      return false;
    }
    
    const styles = window.getComputedStyle(element);
    const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
    
    if (!isVisible) {
      results.components[componentName] = 'invisible';
      results.overallStatus = 'warning';
      return false;
    }
    
    results.components[componentName] = 'pass';
    return true;
  }
  
  // 测试各个组件 - 等页面完全加载后执行
  setTimeout(() => {
    // 导航栏测试
    checkElementRendering('.sidebar', '侧边导航栏');
    checkElementRendering('.mobile-tabbar', '移动端底部导航');
    
    // 卡片和表格测试
    checkElementRendering('.el-card', '卡片组件');
    checkElementRendering('.el-table', '表格组件');
    
    // 表单组件测试
    checkElementRendering('.el-input', '输入框组件');
    checkElementRendering('.el-button', '按钮组件');
    
    // 图标组件测试
    checkElementRendering('.el-icon', '图标组件');
    
    // 发送测试结果到控制台
    console.log('UI组件兼容性测试结果:', results);
    
    // 在页面上显示测试结果（仅在测试模式下）
    if (window.location.search.includes('test=ui')) {
      displayTestResults(detectBrowserAndDevice(), results);
    }
  }, 2000);
  
  return results;
}

// 在页面上显示测试结果
function displayTestResults(browserInfo, testResults) {
  // 创建测试结果容器
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 15px;
    width: 300px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  `;
  
  // 测试信息HTML
  container.innerHTML = `
    <h2 style="margin-top: 0; color: #333; font-size: 16px;">兼容性测试结果</h2>
    <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
      <p><strong>浏览器:</strong> ${browserInfo.name}</p>
      <p><strong>操作系统:</strong> ${browserInfo.os}</p>
      <p><strong>设备类型:</strong> ${browserInfo.deviceCategory}</p>
      <p><strong>屏幕尺寸:</strong> ${browserInfo.screenWidth} × ${browserInfo.screenHeight}</p>
      <p><strong>设备像素比:</strong> ${browserInfo.devicePixelRatio}</p>
    </div>
    
    <h3 style="margin-top: 10px; font-size: 14px;">CSS特性支持</h3>
    <ul style="padding-left: 20px;">
      <li>Flexbox: <span style="color:${testResults.cssFeatures.flexbox === 'pass' ? 'green' : 'red'}">${testResults.cssFeatures.flexbox}</span></li>
      <li>Grid: <span style="color:${testResults.cssFeatures.grid === 'pass' ? 'green' : 'red'}">${testResults.cssFeatures.grid}</span></li>
      <li>CSS变量: <span style="color:${testResults.cssFeatures.cssVariables === 'pass' ? 'green' : 'red'}">${testResults.cssFeatures.cssVariables}</span></li>
      <li>过渡动画: <span style="color:${testResults.cssFeatures.transitions === 'pass' ? 'green' : 'red'}">${testResults.cssFeatures.transitions}</span></li>
    </ul>
    
    <h3 style="margin-top: 10px; font-size: 14px;">组件渲染</h3>
    <ul style="padding-left: 20px;">
      ${Object.entries(testResults.components).map(([key, value]) => `
        <li>${key}: <span style="color:${value === 'pass' ? 'green' : 'red'}">${value}</span></li>
      `).join('')}
    </ul>
    
    <div style="margin-top: 15px; text-align: center;">
      <p><strong>总体结果:</strong> <span style="color:${testResults.overallStatus === 'pass' ? 'green' : 'orange'}">${testResults.overallStatus}</span></p>
    </div>
    
    <button id="close-test-results" style="background: #f5f5f5; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px; width: 100%;">关闭结果</button>
  `;
  
  // 添加到文档
  document.body.appendChild(container);
  
  // 添加关闭按钮功能
  document.getElementById('close-test-results').addEventListener('click', () => {
    container.remove();
  });
}

// 自动运行测试（如果URL参数中有test=ui）
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.search.includes('test=ui')) {
    console.log('浏览器与设备信息:', detectBrowserAndDevice());
    testUIComponents();
  }
});

// 导出测试函数供手动调用
window.jinzaUITest = {
  detectBrowserAndDevice,
  testUIComponents,
  runTest: function() {
    const browserInfo = this.detectBrowserAndDevice();
    console.log('浏览器与设备信息:', browserInfo);
    const testResults = this.testUIComponents();
    displayTestResults(browserInfo, testResults);
    return { browserInfo, testResults };
  }
};