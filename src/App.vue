<template>
  <div id="app">
    <!-- 强制分离登录和主应用视图，避免重叠 -->
    
    <!-- 应用加载状态 -->
    <div v-if="appLoading" class="app-loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    </div>
    
    <!-- 已登录状态 -->
    <div v-else-if="user" class="app-main">
      <!-- 侧边栏遮罩层 - 移动设备菜单展开时显示 -->
      <div 
        class="sidebar-overlay" 
        :class="{ 'visible': sidebarExpanded }"
        @click="toggleSidebar(false)"
      ></div>
      
      <el-container class="layout">
        <!-- 侧边栏 -->
        <el-aside width="240px" class="sidebar" :class="{ 'expanded': sidebarExpanded }">
          <div class="sidebar-header">
            <div class="logo">
              <div class="logo-icon">📊</div>
              <span class="logo-text">企业管理系统</span>
            </div>
            <button class="close-sidebar-btn" @click="toggleSidebar(false)">✕</button>
          </div>
          
          <!-- 用户信息 -->
          <div class="user-info-sidebar">
            <div class="avatar">
              {{ user.name.charAt(0) }}
            </div>
            <div class="user-details">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-role">{{ user.role === 'admin' ? '管理员' : '用户' }}</div>
            </div>
          </div>

          <!-- 导航菜单 -->
          <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            background-color="transparent"
            text-color="#e0e0e0"
            active-text-color="#ffffff"
          >
            <el-menu-item index="customers" @click="navigateAndCloseSidebar('customers')">
              <div class="menu-item-content">
                <div class="menu-icon">👥</div>
                <span class="menu-text">客户管理</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="suppliers" @click="navigateAndCloseSidebar('suppliers')">
              <div class="menu-item-content">
                <div class="menu-icon">🏭</div>
                <span class="menu-text">供应商管理</span>
              </div>
            </el-menu-item>
            
            <el-menu-item v-if="user.role === 'admin'" index="users" @click="navigateAndCloseSidebar('users')">
              <div class="menu-item-content">
                <div class="menu-icon">👨‍💼</div>
                <span class="menu-text">用户管理</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="accountSets" @click="navigateAndCloseSidebar('accountSets')">
              <div class="menu-item-content">
                <div class="menu-icon">📁</div>
                <span class="menu-text">账套管理</span>
              </div>
            </el-menu-item>

            <el-menu-item index="products" @click="navigateAndCloseSidebar('products')">
              <div class="menu-item-content">
                <div class="menu-icon">🛒</div>
                <span class="menu-text">商品库</span>
              </div>
            </el-menu-item>
            
            <el-menu-item index="salespeople" @click="navigateAndCloseSidebar('salespeople')">
              <div class="menu-item-content">
                <div class="menu-icon">👨‍💼</div>
                <span class="menu-text">业务员管理</span>
              </div>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 主内容区 -->
        <el-container>
          <!-- 顶部导航栏 -->
          <el-header class="header">
            <div class="header-left">
              <!-- 汉堡菜单按钮 - 移动设备显示 -->
              <button class="menu-toggle-btn" @click="toggleSidebar()">
                <span class="menu-toggle-icon">☰</span>
              </button>
              <div class="breadcrumb">
                <span class="page-title">{{ getPageTitle(activeMenu) }}</span>
              </div>
            </div>
            <div class="header-right">
              <el-dropdown @command="handleCommand">
                <span class="user-dropdown">
                  <el-avatar :size="32" :src="user.avatar" class="header-avatar">
                    {{ user.name.charAt(0) }}
                  </el-avatar>
                  <span class="user-name">{{ user.name }}</span>
                  <el-icon><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-header>
          
          <!-- 内容主区域 -->
          <el-main class="main-content">
            <div class="page-container">
              <component :is="currentComponent" :user="user" />
            </div>
          </el-main>
        </el-container>
      </el-container>
      
      <!-- 强制密码修改对话框 -->
      <ForcePasswordChange 
        v-if="showForcePwd" 
        :user-id="user.id" 
        :require-old="true" 
        @done="handlePwdUpdated" 
      />
    </div>

    <!-- 未登录状态 - 登录页 -->
    <div v-else-if="!appLoading && !user" class="login-container">
      <div class="login-background">
        <div class="login-card">
          <!-- 登录页标题 -->
          <div class="login-header">
            <div class="login-logo">
              <div class="logo-large">📊</div>
              <h1>企业管理系统</h1>
            </div>
            <p class="login-subtitle">专业的企业管理解决方案</p>
          </div>
          
          <!-- 登录表单 -->
          <el-form class="login-form" @submit.prevent="login">
            <el-form-item>
              <el-input
                v-model="loginForm.username"
                placeholder="用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup="handlePasswordKey"
                @keyup.enter="login"
                @blur="capsLockOn = false"
              />
            </el-form-item>
            <el-form-item v-if="capsLockOn">
              <el-alert
                type="warning"
                title="已开启大写锁定 (Caps Lock)，可能导致密码输入错误"
                :closable="false"
                show-icon
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                size="large" 
                @click="login" 
                class="login-button"
                :loading="loading"
                :disabled="loading"
              >
                {{ loading ? '登录中...' : '登录系统' }}
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-hint">安全提示：请勿在公共设备保存密码。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, markRaw, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';

// 自定义消息函数，避免重复消息
const showMessage = (() => {
  // 记录最近的消息，防止短时间内显示相同消息
  let lastMsg = '';
  let lastType = '';
  let lastTime = 0;
  
  return (type, message) => {
    const now = Date.now();
    // 如果相同消息在1秒内重复出现，则跳过
    if (message === lastMsg && type === lastType && now - lastTime < 1000) {
      return;
    }
    
    lastMsg = message;
    lastType = type;
    lastTime = now;
    
    ElMessage({
      type,
      message,
      grouping: true, // 相同内容的消息会被合并
      showClose: true
    });
  };
})();
import { User, Lock, ArrowDown } from '@element-plus/icons-vue';
import { reportAuthChange, reportApiResult, reportViewChange, reportError, checkAppState } from './utils/debug';

// 导入组件
import Customers from './views/Customers.vue';
import Users from './views/Users.vue';
import AccountSets from './views/AccountSets.vue';
import Salespeople from './views/Salespeople.vue';
import Products from './views/Products.vue';
import Suppliers from './views/Suppliers.vue';
// 移除回收站组件导入
import ForcePasswordChange from './views/ForcePasswordChange.vue';

// 核心应用状态
const user = ref(null);
const activeMenu = ref('customers');
const loginForm = ref({ username: '', password: '' });
const loading = ref(false);
const capsLockOn = ref(false);
const appLoading = ref(true); // 添加应用加载状态变量
const sessionInfo = ref(null); // 会话信息
const sessionCheckInterval = ref(null); // 保存定时器ID
const sidebarExpanded = ref(false); // 控制侧边栏在移动设备上的展开状态

// 禁用用户状态变化的监听器，避免重复消息
// watch(user, (newVal, oldVal) => {
//   reportAuthChange('用户状态发生变化', { before: oldVal, after: newVal });
// }, { deep: true });

// 路由组件映射
const routes = {
  customers: markRaw(Customers),
  users: markRaw(Users),
  accountSets: markRaw(AccountSets),
  products: markRaw(Products),
  suppliers: markRaw(Suppliers),
  salespeople: markRaw(Salespeople),
  // 移除回收站组件
};

// 当前组件
const currentComponent = ref(routes.customers);

// 导航函数
const navigate = (route) => {
  reportViewChange('Navigation', `切换到 ${route} 路由`);
  activeMenu.value = route;
  if (routes[route]) {
    currentComponent.value = routes[route];
    // 保存当前页面状态到本地存储，以便页面刷新后恢复
    localStorage.setItem('jinza_last_page', route);
  }
};

// 获取页面标题
const getPageTitle = (route) => {
  const titles = {
    customers: '客户管理',
    users: '用户管理',
    accountSets: '账套管理',
    products: '商品库',
    suppliers: '供应商管理',
    salespeople: '业务员管理',
    // 移除回收站标题
  };
  return titles[route] || '企业管理系统';
};

// 用户下拉菜单处理
const handleCommand = (command) => {
  if (command === 'logout') {
    logout();
  }
};

// 控制侧边栏在移动设备上的展开/收起
const toggleSidebar = (value) => {
  sidebarExpanded.value = typeof value !== 'undefined' ? value : !sidebarExpanded.value;
  // 当侧边栏展开时，禁止body滚动以防止背景内容滚动
  if (sidebarExpanded.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

// 在导航到新页面时自动收起侧边栏（移动设备）
const navigateAndCloseSidebar = (route) => {
  navigate(route);
  toggleSidebar(false);
};

// 应用初始化 - 检查登录状态
onMounted(async () => {
  reportViewChange('App', '应用挂载完成，检查登录状态');
  try {
    // 设置应用为加载状态，不显示登录界面
    appLoading.value = true;
    
    // 输出调试状态
    checkAppState(user, routes, activeMenu, currentComponent);
    
    // 检查是否已有会话
    reportApiResult('/api/me', '正在检查会话状态');
    const response = await fetch('/api/me');
    if (response.ok) {
      const data = await response.json();
      reportApiResult('/api/me', data);
      
      // 有会话信息
      if (data.user) {
        reportAuthChange('发现现有会话', data.user);
        
        // 设置用户数据
        user.value = {...data.user};
        
        // 保存会话信息
        sessionInfo.value = data.session || null;
        
        // 更新CSS类
        document.body.classList.add('logged-in');
        document.body.classList.remove('logged-out');
        
        // 检查是否需要强制修改密码
        if (data.user.forcePasswordChange) {
          reportViewChange('App', '会话恢复: 检测到需要强制修改密码');
          showForcePwd.value = true;
        }
        
        // 恢复上次访问的页面
        const lastPage = localStorage.getItem('jinza_last_page');
        if (lastPage && routes[lastPage]) {
          reportViewChange('App', `恢复上次访问的页面: ${lastPage}`);
          activeMenu.value = lastPage;
          currentComponent.value = routes[lastPage];
        }
        
        // 启动会话监控
        startSessionMonitor();
        
        reportViewChange('App', '已设置用户状态为已登录');
        checkAppState(user, routes, activeMenu, currentComponent);
      } else {
        reportAuthChange('无有效会话', null);
      }
    } else {
      reportAuthChange('无有效会话或会话已过期', null);
    }
  } catch (error) {
    reportError('检查会话', error);
  } finally {
    // 无论结果如何，最终关闭加载状态
    setTimeout(() => {
      appLoading.value = false;
    }, 300); // 短暂延迟，确保界面平滑过渡
  }
});

// 登录处理
const login = async () => {
  // 表单验证
  if (!loginForm.value.username || !loginForm.value.password) {
    showMessage('error', '请输入用户名和密码');
    return;
  }

  loading.value = true;
  reportAuthChange('开始登录', { username: loginForm.value.username });
  
  try {
    // 发送登录请求
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value)
    });
    
    const data = await response.json();
    reportApiResult('/api/login', data);
    
    if (data.success && data.user) {
      // 清理登录表单
      const credentials = {...loginForm.value};
      loginForm.value = { username: '', password: '' };
      
      reportAuthChange(`用户 ${credentials.username} 登录成功`, data.user);
      
      // 强制重置视图状态并设置用户信息
      // 先重置用户对象
      user.value = null;
      document.body.classList.add('logged-out');
      document.body.classList.remove('logged-in');
      await nextTick();
      reportViewChange('App', '视图已重置为未登录状态');
      
      // 强制延时，确保DOM完全更新
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 然后通过同步方式设置用户并更新CSS类
      user.value = {...data.user};
      document.body.classList.add('logged-in');
      document.body.classList.remove('logged-out');
      reportViewChange('App', '视图已更新为已登录状态');
      
      // 检查并输出最终状态
      setTimeout(() => checkAppState(user, routes, activeMenu, currentComponent), 100);
      // 仅在直接登录时显示欢迎消息，避免重复显示
      if (credentials && credentials.username) {
        showMessage('success', `欢迎回来，${data.user.name}`);
      }
      
      // 处理强制密码更改
      if (data.user.forcePasswordChange) {
        reportViewChange('App', '需要强制修改密码');
        showForcePwd.value = true;
      }
    } else {
      reportError('登录失败', data);
      showMessage('error', data.error || '登录失败');
    }
  } catch (error) {
    reportError('登录过程', error);
    showMessage('error', '登录失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 密码输入区 CapsLock 监测
const handlePasswordKey = (e) => {
  if (e.getModifierState) {
    capsLockOn.value = e.getModifierState('CapsLock');
  }
  // 支持按Enter键登录
  if (e.key === 'Enter') {
    login();
  }
};

// 退出登录
const logout = async () => {
  reportAuthChange('开始退出登录', { userId: user.value?.id });
  try {
    await fetch('/api/logout', { method: 'POST' });
    
    // 更新状态和CSS类
    currentComponent.value = routes.customers;
    activeMenu.value = 'customers';
    
    // 确保用户对象先清空，并更新CSS类
    user.value = null;
    document.body.classList.add('logged-out');
    document.body.classList.remove('logged-in');
    
    await nextTick();
            showMessage('success', '已退出登录');
    reportAuthChange('退出登录成功', null);
    
    // 检查并输出最终状态
    setTimeout(() => checkAppState(user, routes, activeMenu, currentComponent), 100);
  } catch (error) {
    reportError('退出登录', error);
    showMessage('error', '退出失败');
  }
};

const showForcePwd = ref(false);
const handlePwdUpdated = () => {
  showForcePwd.value = false;
  reportViewChange('App', '密码已更新，刷新用户信息');
  // 刷新当前用户信息
  fetch('/api/me')
    .then(r => r.ok ? r.json() : null)
    .then(d => { 
      if (d && d.user) {
        user.value = d.user;
        sessionInfo.value = d.session || null;
        reportAuthChange('用户信息已更新', d.user);
      }
    });
};

// 会话监控相关函数
const startSessionMonitor = () => {
  // 清除旧的定时器
  if (sessionCheckInterval.value) {
    clearInterval(sessionCheckInterval.value);
  }
  
  // 创建新的定时器，每分钟检查一次会话状态
  sessionCheckInterval.value = setInterval(checkSessionStatus, 60000);
  
  // 立即检查一次
  checkSessionStatus();
};

const checkSessionStatus = () => {
  if (!sessionInfo.value || !sessionInfo.value.remainingTime) return;
  
  const now = new Date();
  const expiresAt = new Date(sessionInfo.value.expiresAt);
  const remainingMinutes = Math.max(0, Math.round((expiresAt - now) / 60000));
  
  // 如果会话过期时间小于10分钟，提醒用户
  if (remainingMinutes <= 10 && remainingMinutes > 0) {
    showMessage('warning', `您的会话将在${remainingMinutes}分钟后过期，请及时保存工作`);
  }
  
  // 如果会话已经过期，强制登出
  if (remainingMinutes <= 0) {
    showMessage('error', '您的会话已过期，请重新登录');
    setTimeout(() => logout(), 2000);
  }
};

// 在组件卸载时清除定时器
onBeforeUnmount(() => {
  if (sessionCheckInterval.value) {
    clearInterval(sessionCheckInterval.value);
  }
});
</script>

<style scoped>
/* 全局布局样式 */
#app {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  width: 100vw;
  position: relative;
}

/* 加载界面样式 */
.app-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 2001;
  color: white;
  font-size: 18px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 已登录状态和未登录状态互斥布局 */
.app-main, .login-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 已登录状态容器 */
.app-main {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 已登录布局样式 */
.layout {
  height: 100vh;
  background: #f5f7fa;
}

/* 侧边栏样式 */
.sidebar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.user-info-sidebar {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  color: white;
}

.user-details {
  color: white;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  opacity: 0.8;
}

.sidebar-menu {
  border: none;
  margin-top: 10px;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  margin: 4px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.2) !important;
  border-left: 3px solid #ffffff;
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  font-size: 18px;
}

.menu-text {
  font-weight: 500;
}

/* 头部样式 */
.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 10; /* 确保顶部导航在更高层级 */
}

.header-left .page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right .user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.3s;
}

.header-right .user-dropdown:hover {
  background: #f5f7fa;
}

.header-avatar {
  background: #409eff;
}

.user-name {
  font-weight: 500;
}

/* 主内容区 */
.main-content {
  padding: 0;
  background: #f5f7fa;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 60px); /* 减去头部高度 */
  z-index: 1;
}

.page-container {
  padding: 24px;
  min-height: 100%;
}

/* 登录页样式 */
.login-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* 确保登录页在最高层级 */
}

.login-background {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2px;
}

.login-card {
  background: white;
  border-radius: 18px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-large {
  font-size: 48px;
}

.login-logo h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.login-subtitle {
  margin: 8px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-weight: 500;
}

.login-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  text-align: center;
  user-select: none;
}

/* 移动端菜单按钮 */
.menu-toggle-btn {
  display: none;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  width: 40px;
  height: 40px;
  margin-right: 10px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
}

/* 侧边栏关闭按钮 */
.close-sidebar-btn {
  display: none;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 18px;
  position: absolute;
  right: 10px;
  top: 15px;
  cursor: pointer;
}

/* 在移动设备上显示关闭按钮 */
@media (max-width: 767px) {
  .close-sidebar-btn {
    display: block;
  }
  
  .sidebar-header {
    position: relative;
    padding-right: 40px;
  }
  
  /* 调整主内容区域在移动端的样式 */
  .el-main {
    padding: 10px !important;
  }
  
  /* 调整表单在移动端的样式 */
  .el-form-item {
    margin-bottom: 15px !important;
  }
  
  /* 移动端表格调整 */
  .el-table .cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* 表单按钮在移动端占满宽度 */
  .form-actions .el-button {
    width: 100%;
    margin: 5px 0;
  }
}
</style>