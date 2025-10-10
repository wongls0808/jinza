import { createI18n } from 'vue-i18n'

const messages = {
  zh: {
    app: {
      title: '企业管理系统',
      logout: '退出登录',
    },
    login: {
      title: '登录',
      username: '用户名',
      password: '密码',
      submit: '登录',
    },
    home: {
      welcome: '欢迎回来',
      users: '用户管理',
      customers: '客户管理',
      products: '商品库',
      invoices: '发票管理',
      settings: '系统设置',
      usersDesc: '系统用户与权限分配',
      customersDesc: '管理客户档案与往来',
      productsDesc: '维护商品与库存',
      invoicesDesc: '开票、预览与打印',
      settingsDesc: '基础资料与偏好',
    },
    settings: {
      title: '系统设置',
      theme: '主题',
      light: '浅色',
      dark: '深色',
      language: '语言',
      zh: '中文',
      en: '英文',
    }
  },
  en: {
    app: {
      title: 'Enterprise Management',
      logout: 'Logout',
    },
    login: {
      title: 'Sign In',
      username: 'Username',
      password: 'Password',
      submit: 'Login',
    },
    home: {
      welcome: 'Welcome back',
      users: 'User Management',
      customers: 'Customers',
      products: 'Products',
      invoices: 'Invoices',
      settings: 'Settings',
      usersDesc: 'System users & permissions',
      customersDesc: 'Manage customer profiles',
      productsDesc: 'Maintain products & stock',
      invoicesDesc: 'Billing, preview & print',
      settingsDesc: 'Basics & preferences',
    },
    settings: {
      title: 'Settings',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      language: 'Language',
      zh: 'Chinese',
      en: 'English',
    }
  }
}

const locale = localStorage.getItem('lang') || 'zh'

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'zh',
  messages,
})
