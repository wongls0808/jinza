<template>
  <div id="app">
    <el-container v-if="user" class="layout">
      <!-- 侧边栏 - 现代风格 -->
      <el-aside width="240px" class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon">📊</div>
            <span class="logo-text">企业管理系统</span>
          </div>
        </div>
        
        <div class="user-info-sidebar">
          <div class="avatar">
            {{ user.name.charAt(0) }}
          </div>
          <div class="user-details">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-role">{{ user.role === 'admin' ? '管理员' : '用户' }}</div>
          </div>
        </div>

        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="transparent"
          text-color="#e0e0e0"
          active-text-color="#ffffff"
        >
          <el-menu-item index="customers" @click="navigate('customers')">
            <div class="menu-item-content">
              <div class="menu-icon">👥</div>
              <span class="menu-text">客户管理</span>
            </div>
          </el-menu-item>
          
          <el-menu-item v-if="user.role === 'admin'" index="users" @click="navigate('users')">
            <div class="menu-item-content">
              <div class="menu-icon">👨‍💼</div>
              <span class="menu-text">用户管理</span>
            </div>
          </el-menu-item>
          
          <el-menu-item index="accountSets" @click="navigate('accountSets')">
            <div class="menu-item-content">
              <div class="menu-icon">📁</div>
              <span class="menu-text">账套管理</span>
            </div>
          </el-menu-item>
          <el-menu-item index="recycle" @click="navigate('recycle')">
            <div class="menu-item-content">
              <div class="menu-icon">🗑️</div>
              <span class="menu-text">回收站</span>
            </div>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header class="header">
          <div class="header-left">
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
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <!-- 动态组件渲染 -->
          <div class="page-container">
            <component :is="currentComponent" :user="user" />
          </div>
        </el-main>
      </el-container>
    </el-container>
    <ForcePasswordChange v-if="user && showForcePwd" :user-id="user.id" :require-old="true" @done="handlePwdUpdated" />

    <!-- 登录页 - 现代风格 -->
    <div v-else class="login-container">
      <div class="login-background">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">
              <div class="logo-large">📊</div>
              <h1>企业管理系统</h1>
            </div>
            <p class="login-subtitle">专业的企业管理解决方案</p>
          </div>
          
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
import { ref, onMounted, markRaw } from 'vue';
import { ElMessage } from 'element-plus';
import { User, Lock, ArrowDown } from '@element-plus/icons-vue';

// 导入组件
import Customers from './views/Customers.vue';
import Users from './views/Users.vue';
import AccountSets from './views/AccountSets.vue';
import RecycleBin from './views/RecycleBin.vue';
import ForcePasswordChange from './views/ForcePasswordChange.vue';

const user = ref(null);
const activeMenu = ref('customers');
const loginForm = ref({ username: '', password: '' });
const loading = ref(false);
const capsLockOn = ref(false);

// 定义路由组件映射
const routes = {
  customers: markRaw(Customers),
  users: markRaw(Users),
  accountSets: markRaw(AccountSets),
  recycle: markRaw(RecycleBin)
};

// 当前组件
const currentComponent = ref(routes.customers);

// 导航函数
const navigate = (route) => {
  activeMenu.value = route;
  if (routes[route]) {
    currentComponent.value = routes[route];
  }
};

// 获取页面标题
const getPageTitle = (route) => {
  const titles = {
    customers: '客户管理',
    users: '用户管理',
    accountSets: '账套管理',
    recycle: '回收站'
  };
  return titles[route] || '企业管理系统';
};

// 用户下拉菜单处理
const handleCommand = (command) => {
  if (command === 'logout') {
    logout();
  } else if (command === 'profile') {
    ElMessage.info('个人资料功能开发中');
  } else if (command === 'settings') {
    ElMessage.info('系统设置功能开发中');
  }
};

// 检查登录状态
onMounted(async () => {
  try {
    const response = await fetch('/api/me');
    if (response.ok) {
      const data = await response.json();
      user.value = data.user;
    }
  } catch (error) {
    console.log('未登录');
  }
});

// 登录
const login = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.error('请输入用户名和密码');
    return;
  }

  loading.value = true;
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value)
    });
    
    const data = await response.json();
    if (data.success) {
      user.value = data.user;
      ElMessage.success('登录成功');
      if (data.user.forcePasswordChange) {
        showForcePwd.value = true;
      }
    } else {
      ElMessage.error(data.error || '登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 密码输入区 CapsLock 监测
const handlePasswordKey = (e) => {
  if (e.getModifierState) {
    capsLockOn.value = e.getModifierState('CapsLock');
  }
};

// 退出
const logout = async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
    user.value = null;
    currentComponent.value = routes.customers;
    activeMenu.value = 'customers';
    ElMessage.success('已退出登录');
  } catch (error) {
    console.error('退出失败:', error);
  }
};

const showForcePwd = ref(false);
const handlePwdUpdated = () => {
  showForcePwd.value = false;
  // 刷新当前用户信息
  fetch('/api/me').then(r=>r.ok?r.json():null).then(d=>{ if(d && d.user) user.value = d.user; });
};
</script>

<style scoped>
/* 现代布局样式 */
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
  color: white;
  font-weight: 600;
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
}

.page-container {
  padding: 24px;
  min-height: calc(100vh - 60px);
}

/* 登录页样式 */
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
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

</style>