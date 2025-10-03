/**
 * Jinza企业管理系统 - 响应式设计测试工具
 * 此工具用于验证不同尺寸屏幕下的UI布局和组件表现
 */

// 响应式测试工具类
class ResponsiveTestTool {
  constructor() {
    // 断点定义 - 与CSS中保持一致
    this.breakpoints = {
      xs: 0,      // 超小屏幕 - 手机竖屏
      sm: 576,    // 小屏幕 - 手机横屏
      md: 768,    // 中等屏幕 - 平板竖屏
      lg: 992,    // 大屏幕 - 平板横屏/小型笔记本
      xl: 1200,   // 超大屏幕 - 桌面显示器
      xxl: 1600   // 超超大屏幕 - 大型显示器
    };
    
    // 测试设备预设
    this.devicePresets = [
      { name: 'iPhone SE', width: 375, height: 667, deviceType: 'mobile' },
      { name: 'iPhone 13', width: 390, height: 844, deviceType: 'mobile' },
      { name: 'iPhone 13 Pro Max', width: 428, height: 926, deviceType: 'mobile' },
      { name: 'iPad', width: 768, height: 1024, deviceType: 'tablet' },
      { name: 'iPad Pro', width: 1024, height: 1366, deviceType: 'tablet' },
      { name: 'Laptop', width: 1366, height: 768, deviceType: 'desktop' },
      { name: 'Desktop', width: 1920, height: 1080, deviceType: 'desktop' }
    ];
    
    // 关键布局元素选择器
    this.layoutSelectors = {
      sidebar: '.sidebar',
      content: '.main-content',
      header: '.header',
      mobileTabbar: '.mobile-tabbar',
      cards: '.el-card',
      tables: '.el-table',
      forms: '.el-form',
      buttons: '.el-button'
    };
  }
  
  // 获取当前激活的断点
  getCurrentBreakpoint() {
    const width = window.innerWidth;
    let currentBreakpoint = 'xs';
    
    for (const [breakpoint, minWidth] of Object.entries(this.breakpoints)) {
      if (width >= minWidth) {
        currentBreakpoint = breakpoint;
      }
    }
    
    return currentBreakpoint;
  }
  
  // 获取断点名称的友好显示
  getBreakpointName(breakpointCode) {
    const names = {
      xs: '超小屏幕 (手机竖屏)',
      sm: '小屏幕 (手机横屏)',
      md: '中等屏幕 (平板竖屏)',
      lg: '大屏幕 (平板横屏/小笔记本)',
      xl: '超大屏幕 (桌面显示器)',
      xxl: '超超大屏幕 (大型显示器)'
    };
    
    return names[breakpointCode] || breakpointCode;
  }
  
  // 检测元素的可见性
  isElementVisible(selector) {
    const element = document.querySelector(selector);
    if (!element) return { exists: false, visible: false };
    
    const styles = window.getComputedStyle(element);
    const isVisible = styles.display !== 'none' && 
                      styles.visibility !== 'hidden' && 
                      parseFloat(styles.opacity) > 0;
    
    return { 
      exists: true, 
      visible: isVisible,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  }
  
  // 分析布局问题
  analyzeLayout() {
    const result = {
      breakpoint: this.getCurrentBreakpoint(),
      breakpointName: this.getBreakpointName(this.getCurrentBreakpoint()),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      elements: {},
      issues: [],
      timestamp: new Date().toISOString()
    };
    
    // 检查每个关键布局元素
    for (const [name, selector] of Object.entries(this.layoutSelectors)) {
      result.elements[name] = this.isElementVisible(selector);
      
      // 检测可能的布局问题
      const element = document.querySelector(selector);
      if (element) {
        // 检查元素是否溢出其父元素
        const rect = element.getBoundingClientRect();
        const parent = element.parentElement;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        
        if (parentRect) {
          const isOverflowing = rect.left < parentRect.left || 
                               rect.right > parentRect.right ||
                               rect.top < parentRect.top ||
                               rect.bottom > parentRect.bottom;
          
          if (isOverflowing) {
            result.issues.push({
              element: name,
              type: 'overflow',
              message: `${name} 元素溢出其父容器`
            });
          }
        }
        
        // 检查文本是否被截断
        const hasEllipsis = window.getComputedStyle(element).textOverflow === 'ellipsis';
        const isTextTruncated = hasEllipsis && element.scrollWidth > element.clientWidth;
        
        if (isTextTruncated) {
          result.issues.push({
            element: name,
            type: 'text-truncation',
            message: `${name} 元素中的文本被截断`
          });
        }
        
        // 检查触摸目标尺寸问题（在移动设备上）
        const currentBreakpoint = this.getCurrentBreakpoint();
        if ((currentBreakpoint === 'xs' || currentBreakpoint === 'sm') && 
            (name === 'buttons' || selector.includes('clickable'))) {
          const minTouchSize = 44; // 推荐的最小触摸目标尺寸(px)
          
          if (rect.width < minTouchSize || rect.height < minTouchSize) {
            result.issues.push({
              element: name,
              type: 'touch-target-size',
              message: `${name} 元素在移动设备上的尺寸过小（触摸不友好）`
            });
          }
        }
      }
    }
    
    // 根据当前断点检查特定问题
    const currentBreakpoint = this.getCurrentBreakpoint();
    
    // 在移动设备上检查侧边栏状态
    if (currentBreakpoint === 'xs' || currentBreakpoint === 'sm') {
      const sidebar = document.querySelector(this.layoutSelectors.sidebar);
      if (sidebar && window.getComputedStyle(sidebar).position !== 'fixed') {
        result.issues.push({
          element: 'sidebar',
          type: 'mobile-layout',
          message: '侧边栏在移动设备上应该使用固定定位'
        });
      }
      
      // 检查移动端底部导航栏是否显示
      if (!result.elements.mobileTabbar.visible) {
        result.issues.push({
          element: 'mobileTabbar',
          type: 'missing-mobile-navigation',
          message: '移动设备上底部导航栏未显示'
        });
      }
    } else {
      // 在桌面设备上检查侧边栏是否可见
      if (!result.elements.sidebar.visible) {
        result.issues.push({
          element: 'sidebar',
          type: 'missing-desktop-navigation',
          message: '桌面设备上侧边栏未显示'
        });
      }
    }
    
    return result;
  }
  
  // 模拟不同设备尺寸
  simulateDevice(deviceName) {
    const device = this.devicePresets.find(d => d.name === deviceName);
    if (!device) {
      console.error(`未找到设备预设: ${deviceName}`);
      return null;
    }
    
    // 记录当前窗口尺寸以便稍后恢复
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    // 通过创建一个iframe来模拟设备尺寸
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: ${device.width}px;
      height: ${device.height}px;
      border: 10px solid #333;
      border-radius: 20px;
      z-index: 10000;
      background: #fff;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      resize: both;
      overflow: hidden;
    `;
    
    iframe.src = window.location.href;
    
    // 添加设备标题和控制按钮
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      background: #333;
      color: #fff;
      padding: 8px 15px;
      border-radius: 10px 10px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
      width: ${device.width}px;
    `;
    
    header.innerHTML = `
      <div>${device.name} (${device.width}×${device.height})</div>
      <div>
        <button id="analyze-device-btn" style="background: #4a8bfc; border: none; color: white; padding: 4px 8px; border-radius: 4px; margin-right: 10px; cursor: pointer;">分析布局</button>
        <button id="close-device-btn" style="background: #f44336; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">关闭</button>
      </div>
    `;
    
    wrapper.appendChild(header);
    wrapper.appendChild(iframe);
    
    document.body.appendChild(wrapper);
    
    // 添加可拖拽功能
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffsetX = e.clientX - wrapper.offsetLeft;
      dragOffsetY = e.clientY - wrapper.offsetTop;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        wrapper.style.left = (e.clientX - dragOffsetX) + 'px';
        wrapper.style.top = (e.clientY - dragOffsetY) + 'px';
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // 添加按钮事件处理
    document.getElementById('close-device-btn').addEventListener('click', () => {
      wrapper.remove();
    });
    
    document.getElementById('analyze-device-btn').addEventListener('click', () => {
      try {
        // 在iframe内分析布局
        const analysis = iframe.contentWindow.jinzaResponsiveTest.analyzeLayout();
        this.displayAnalysisResults(analysis, deviceName);
      } catch (error) {
        console.error('无法在iframe中分析布局:', error);
        alert('分析失败，请确保已在页面中加载响应式测试工具');
      }
    });
    
    return {
      iframe,
      wrapper,
      restore: () => {
        wrapper.remove();
      }
    };
  }
  
  // 显示分析结果
  displayAnalysisResults(results, deviceName = '') {
    // 创建结果显示容器
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border-radius: 10px;
      padding: 20px;
      width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      z-index: 10002;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    // 创建结果内容
    const deviceInfo = deviceName ? `设备: ${deviceName} - ` : '';
    const issuesCount = results.issues.length;
    const issuesList = results.issues.map(issue => 
      `<li style="margin-bottom: 8px; color: ${issue.type === 'overflow' ? '#f44336' : '#ff9800'}">
        <strong>${issue.element}:</strong> ${issue.message}
      </li>`
    ).join('');
    
    // 元素状态表格
    const elementsTable = Object.entries(results.elements).map(([name, data]) => {
      const statusColor = !data.exists ? '#f44336' : (data.visible ? '#4caf50' : '#ff9800');
      const statusText = !data.exists ? '不存在' : (data.visible ? '可见' : '隐藏');
      
      return `
        <tr>
          <td>${name}</td>
          <td style="color: ${statusColor}">${statusText}</td>
          <td>${data.width || 'N/A'}</td>
          <td>${data.height || 'N/A'}</td>
        </tr>
      `;
    }).join('');
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 18px;">响应式布局分析结果</h2>
        <button id="close-analysis-btn" style="background: #f5f5f5; border: 1px solid #ddd; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
      </div>
      
      <div style="background: #f5f7fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <p><strong>${deviceInfo}断点: ${results.breakpointName}</strong></p>
        <p>屏幕尺寸: ${results.screenWidth} × ${results.screenHeight}px</p>
        <p>分析时间: ${new Date(results.timestamp).toLocaleString()}</p>
      </div>
      
      <h3 style="margin: 15px 0 10px; font-size: 16px;">布局问题 (${issuesCount})</h3>
      ${issuesCount > 0 
        ? `<ul style="padding-left: 20px; margin-bottom: 20px;">${issuesList}</ul>`
        : '<p style="color: #4caf50;">✓ 未发现布局问题</p>'
      }
      
      <h3 style="margin: 15px 0 10px; font-size: 16px;">元素状态</h3>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f7fa;">
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">元素</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">状态</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">宽度(px)</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">高度(px)</th>
            </tr>
          </thead>
          <tbody>
            ${elementsTable}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button id="save-analysis-btn" style="background: #4a8bfc; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">导出分析结果</button>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // 添加关闭按钮事件
    document.getElementById('close-analysis-btn').addEventListener('click', () => {
      container.remove();
    });
    
    // 添加导出功能
    document.getElementById('save-analysis-btn').addEventListener('click', () => {
      const filename = `jinza-responsive-analysis-${deviceName || results.breakpoint}-${new Date().toISOString().slice(0,10)}.json`;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  }
  
  // 启动测试界面
  showTestInterface() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #fff;
      border-radius: 10px;
      padding: 15px;
      width: 300px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    let deviceOptions = '';
    this.devicePresets.forEach(device => {
      deviceOptions += `<option value="${device.name}">${device.name} (${device.width}×${device.height})</option>`;
    });
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0; font-size: 16px;">响应式设计测试工具</h2>
        <button id="close-test-interface-btn" style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
      </div>
      
      <p style="margin-bottom: 15px;">选择设备预设或分析当前布局:</p>
      
      <select id="device-select" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;">
        <option value="" disabled selected>选择设备预设...</option>
        ${deviceOptions}
      </select>
      
      <div style="display: flex; gap: 10px;">
        <button id="simulate-device-btn" style="flex: 1; background: #4a8bfc; color: white; border: none; padding: 8px 0; border-radius: 4px; cursor: pointer;">模拟设备</button>
        <button id="analyze-current-btn" style="flex: 1; background: #4caf50; color: white; border: none; padding: 8px 0; border-radius: 4px; cursor: pointer;">分析当前布局</button>
      </div>
      
      <p style="margin-top: 15px; font-size: 12px; color: #666;">提示: 可以使用浏览器的开发者工具(F12)中的设备模拟功能进行更精确的测试。</p>
    `;
    
    document.body.appendChild(container);
    
    // 添加事件监听
    document.getElementById('close-test-interface-btn').addEventListener('click', () => {
      container.remove();
    });
    
    document.getElementById('simulate-device-btn').addEventListener('click', () => {
      const deviceName = document.getElementById('device-select').value;
      if (!deviceName) {
        alert('请先选择一个设备');
        return;
      }
      
      this.simulateDevice(deviceName);
    });
    
    document.getElementById('analyze-current-btn').addEventListener('click', () => {
      const analysis = this.analyzeLayout();
      this.displayAnalysisResults(analysis);
    });
  }
  
  // 导出测试结果
  exportTestReport() {
    const allResults = [];
    
    // 分析当前布局
    const currentLayoutAnalysis = this.analyzeLayout();
    allResults.push({
      device: 'current',
      ...currentLayoutAnalysis
    });
    
    // 创建下载
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allResults, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `jinza-responsive-test-report-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

// 初始化并导出
const jinzaResponsiveTest = new ResponsiveTestTool();
window.jinzaResponsiveTest = jinzaResponsiveTest;

// 检查URL参数是否要求显示测试界面
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.search.includes('test=responsive')) {
    setTimeout(() => {
      jinzaResponsiveTest.showTestInterface();
    }, 1000);
  }
});