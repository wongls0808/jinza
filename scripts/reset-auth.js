// 重置认证状态脚本
// 这个脚本将清除浏览器localStorage中的auth_user信息并重新生成开发者token
// 在浏览器控制台中粘贴并运行此脚本

// 清除当前认证信息
localStorage.removeItem('auth_user');

// 重新生成开发者token和权限
const devUser = {
  token: 'dev-mock-token',
  user: { 
    id: 1, 
    username: 'admin', 
    display_name: '开发者账户' 
  },
  perms: [
    'view_dashboard', 
    'manage_users', 
    'view_customers', 
    'view_banks', 
    'view_accounts', 
    'view_settings',
    'view_account_management'
  ]
};

// 存储新的认证信息
localStorage.setItem('auth_user', JSON.stringify(devUser));

// 显示确认消息
console.log('认证状态已重置，请刷新页面');