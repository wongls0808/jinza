<template>
  <div id="app">
    <el-container v-if="user" class="layout">
      <!-- 侧边栏 -->
      <el-aside width="200px" class="sidebar">
        <div class="logo">企业管理系统</div>
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="/customers">
            <el-icon><User /></el-icon>
            <span>客户管理</span>
          </el-menu-item>
          <el-menu-item index="/projects">
            <el-icon><Document /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item v-if="user.role === 'admin'" index="/users">
            <el-icon><Setting /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header class="header">
          <div class="user-info">
            <span>欢迎, {{ user.name }}</span>
            <el-button type="text" @click="logout">退出</el-button>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <router-view :user="user" />
        </el-main>
      </el-container>
    </el-container>

    <!-- 登录页 -->
    <div v-else class="login-container">
      <el-card class="login-box">
        <template #header>
          <h2>企业管理系统</h2>
        </template>
        <el-form @submit.prevent="login">
          <el-form-item label="用户名">
            <el-input v-model="loginForm.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="login" style="width: 100%">登录</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from './utils/router.js';

const { currentRoute, navigate } = useRouter();
const user = ref(null);
const activeMenu = ref('/dashboard');
const loginForm = ref({ username: '', password: '' });

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
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginForm.value)
  });
  
  const data = await response.json();
  if (data.success) {
    user.value = data.user;
    navigate('/dashboard');
  } else {
    ElMessage.error(data.error);
  }
};

// 退出
const logout = async () => {
  await fetch('/api/logout', { method: 'POST' });
  user.value = null;
  navigate('/');
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #263445;
}

.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}

.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
}
</style>