// 可在生产环境中运行的前端认证重置脚本
// 在浏览器控制台运行此脚本以清除认证状态并提示重新登录

(function() {
  // 清除当前认证信息
  localStorage.removeItem('auth_user');
  
  // 提示用户
  console.log('%c认证状态已重置', 'color: green; font-weight: bold; font-size: 16px');
  console.log('%c请刷新页面并重新登录，确保您的账户有"入账管理"权限', 'color: blue; font-size: 14px');
  
  // 询问是否刷新
  if (confirm('认证状态已重置。是否立即刷新页面？')) {
    window.location.reload();
  }
})();