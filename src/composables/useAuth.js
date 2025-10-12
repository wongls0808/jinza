import { reactive } from 'vue'

const state = reactive({
  token: 'dev-mock-token',  // 开发模式下的模拟令牌
  user: {
    id: 1, 
    username: 'admin', 
    display_name: '开发者账户'
  },  // 模拟用户
  perms: [
    'view_dashboard', 
    'manage_users', 
    'view_customers', 
    'view_banks', 
    'view_accounts', 
    'view_settings',
    'view_account_management'
  ]  // 所有权限
})

function load() {
  // 开发模式：如果没有存储用户信息，使用默认的开发者权限
  const raw = localStorage.getItem('auth_user')
  if (!raw) {
    // 存储开发模式下的默认用户
    const devUser = {
      token: state.token,
      user: state.user,
      perms: state.perms
    }
    localStorage.setItem('auth_user', JSON.stringify(devUser))
    return
  }
  
  try {
    const data = JSON.parse(raw)
    state.token = data.token
    state.user = data.user
    state.perms = data.perms || []
  } catch {
    // 如果解析失败，重新设置为默认值
    const devUser = {
      token: 'dev-mock-token',
      user: { id: 1, username: 'admin', display_name: '开发者账户' },
      perms: ['view_dashboard', 'manage_users', 'view_customers', 'view_banks', 'view_accounts', 'view_settings', 'view_account_management']
    }
    localStorage.setItem('auth_user', JSON.stringify(devUser))
    state.token = devUser.token
    state.user = devUser.user
    state.perms = devUser.perms
  }
}

function save(data) {
  localStorage.setItem('auth_user', JSON.stringify(data))
  load()
}

function logout() {
  // 开发模式：登出后重新设置为开发者账户
  const devUser = {
    token: 'dev-mock-token',
    user: { id: 1, username: 'admin', display_name: '开发者账户' },
    perms: ['view_dashboard', 'manage_users', 'view_customers', 'view_banks', 'view_accounts', 'view_settings', 'view_account_management']
  }
  localStorage.setItem('auth_user', JSON.stringify(devUser))
  state.token = devUser.token
  state.user = devUser.user
  state.perms = devUser.perms
}

function has(perm) {
  // 检查用户是否拥有特定权限
  return state.perms.includes(perm)
}

// 初始化开发模式用户数据
load()

export function useAuth() {
  return { state, has, save, logout }
}
