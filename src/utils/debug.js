/**
 * debug.js - 增强调试工具库
 * 用于记录认证流程、API调用和视图变化的高级调试函数
 */

// 启用/禁用不同类型的调试输出
const debugConfig = {
    auth: false,    // 认证相关，设置为false避免重复消息
    api: false,     // API调用，设置为false避免重复消息
    view: false,    // 视图变化，设置为false避免重复消息
    error: true     // 错误信息，保持启用以便调试错误
};

/**
 * 打印格式化的调试信息
 * @param {string} category 调试信息类别 
 * @param {string} message 信息内容
 * @param {any} data 要打印的数据
 */
export function debugLog(category, message, data) {
  if (!debugConfig[category]) return;
  
  const styles = {
    auth: 'background: #4CAF50; color: white; padding: 2px 4px; border-radius: 2px;',
    api: 'background: #2196F3; color: white; padding: 2px 4px; border-radius: 2px;',
    view: 'background: #9C27B0; color: white; padding: 2px 4px; border-radius: 2px;',
    error: 'background: #F44336; color: white; padding: 2px 4px; border-radius: 2px;',
  };

  const style = styles[category] || 'background: #607D8B; color: white; padding: 2px 4px; border-radius: 2px;';
  
  console.group(`%c${category.toUpperCase()}`, style);
  console.log('时间:', new Date().toLocaleTimeString());
  
  if (data !== undefined) {
    console.log(message, data);
  } else {
    console.log(message);
  }
  
  // 获取调用堆栈 (不包括本函数)
  const stack = new Error().stack.split('\n').slice(2, 4).join('\n');
  console.log('调用位置:', stack);
  console.groupEnd();
}

/**
 * 报告视图状态变化
 * @param {string} component 发生变化的组件
 * @param {string} action 动作描述
 */
export function reportViewChange(component, action) {
  debugLog('view', `[${component}] ${action}`);
}

/**
 * 报告API调用结果
 * @param {string} endpoint API端点
 * @param {any} response 响应数据
 */
export function reportApiResult(endpoint, response) {
  const isRequest = typeof response === 'string';
  debugLog('api', `[${endpoint}] ${isRequest ? '请求' : '响应'}`, response);
}

/**
 * 报告用户认证状态变化
 * @param {string} action 动作描述
 * @param {any} userData 用户数据
 */
export function reportAuthChange(action, userData) {
  debugLog('auth', action, userData);
}

/**
 * 报告错误
 * @param {string} context 错误上下文
 * @param {Error|string} error 错误对象或信息
 */
export function reportError(context, error) {
  debugLog('error', `[${context}]`, error);
  console.error(error);
}

/**
 * 便捷的应用状态检查
 */
export function checkAppState(user, routes, activeMenu, currentComponent) {
  if (!debugConfig.view) return;
  
  console.group('%c应用状态检查', 'background:#8e44ad; color:white; padding:3px 6px; border-radius:3px; font-weight:bold;');
  console.log('当前用户:', user?.value);
  console.log('登录状态:', user?.value ? '已登录' : '未登录');
  console.log('当前路由:', activeMenu?.value);
  console.log('当前组件:', currentComponent?.value);
  console.log('可用路由:', routes ? Object.keys(routes) : 'unknown');
  console.log('当前URL:', window.location.href);
  console.groupEnd();
}