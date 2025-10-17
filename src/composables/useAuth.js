import { reactive } from "vue"

const state = reactive({
  token: "dev-mock-token",  // 开发模式下的模拟令牌
  user: { id: 1, username: "admin", display_name: "开发者账户", is_admin: true },
  // 默认给到常用权限，包含 view_fx 以便本地预览 FX 相关入口
  perms: [
    "view_dashboard",
    "manage_users",
    "view_customers",
    "view_banks",
    "view_accounts",
    "view_transactions",
    "view_fx",
    "view_settings",
    "view_account_management"
  ]
})

function load() {
  // 使用 Vite 推荐的环境变量与本地 host 作为开发判断，不依赖 process.env
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
    (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname))
  // 首先尝试从会话存储中加载用户数据（优先级最高）
  const sessionData = sessionStorage.getItem("auth_user")
  
  // 如果会话存储中没有数据，且设置了"记住我"，则尝试从本地存储中恢复
  const localData = localStorage.getItem("auth_user")
  const rememberAuth = localStorage.getItem("remember_auth") === "1"
  
  // 决定使用哪个数据源
  const raw = sessionData || (rememberAuth ? localData : null)
  
  if (!raw) {
    // 在开发或本机预览时，注入一个本地开发账号，便于无后端查看页面
    if (isDev) {
  const devUser = { token: state.token, user: state.user, perms: state.perms }
      sessionStorage.setItem("auth_user", JSON.stringify(devUser))
      return
    }
    // 非开发场景：清空鉴权，交由登录页处理
    state.token = null
    state.user = null
    state.perms = []
    return
  }
  
  try {
    const data = JSON.parse(raw)
    state.token = data.token
    state.user = data.user
    state.perms = data.perms || []
    
    // 如果数据来自本地存储，同步到会话存储
    if (!sessionData && localData && rememberAuth) {
      sessionStorage.setItem("auth_user", raw)
    }
  } catch {
    // 如果解析失败，兜底为本地开发账号（包含 view_fx）
    const devUser = {
      token: "dev-mock-token",
      user: { id: 1, username: "admin", display_name: "开发者账户", is_admin: true },
      perms: [
        "view_dashboard","manage_users","view_customers","view_banks","view_accounts",
        "view_transactions","view_fx","view_settings","view_account_management"
      ]
    }
    sessionStorage.setItem("auth_user", JSON.stringify(devUser))
    state.token = devUser.token
    state.user = devUser.user
    state.perms = devUser.perms
  }
}

function save(data, rememberMe = false) {
  // 存储到会话存储中，关闭浏览器即失效
  sessionStorage.setItem("auth_user", JSON.stringify(data))
  
  // 如果勾选了"记住我"，也存储到本地存储中
  if (rememberMe) {
    localStorage.setItem("auth_user", JSON.stringify(data))
  } else {
    localStorage.removeItem("auth_user")
  }
  
  load()
}

function logout() {
  // 清除所有存储的用户数据
  sessionStorage.removeItem("auth_user")
  sessionStorage.removeItem("auth_session")
  localStorage.removeItem("auth_user")
  localStorage.removeItem("remember_auth")
  
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
    (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname))
  if (isDev) {
    // 开发模式：登出后重新设置为开发者账户（包含 view_fx）
    const devUser = {
      token: "dev-mock-token",
      user: { id: 1, username: "admin", display_name: "开发者账户", is_admin: true },
      perms: [
        "view_dashboard","manage_users","view_customers","view_banks","view_accounts",
        "view_transactions","view_fx","view_settings","view_account_management"
      ]
    }
    sessionStorage.setItem("auth_user", JSON.stringify(devUser))
    state.token = devUser.token
    state.user = devUser.user
    state.perms = devUser.perms
  } else {
    // 生产环境：完全清除状态
    state.token = null
    state.user = null
    state.perms = []
  }
}

function has(perm) {
  // 管理员直通（与后端保持一致）：管理员无需逐项勾选
  if (state?.user?.is_admin) return true
  // 检查用户是否拥有特定权限
  return state.perms.includes(perm)
}

// 初始化开发模式用户数据
load()

export function useAuth() {
  return { state, has, save, logout }
}
