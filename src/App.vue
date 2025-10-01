<template>
  <div id="app">
    <el-container v-if="user" class="layout">
      <!-- 侧边栏 -->
      <el-aside width="200px" class="sidebar">
        <div class="logo">企业管理系统</div>
        <el-menu
          :default-active="activeMenu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="customers" @click="navigate('customers')">
            <el-icon><User /></el-icon>
            <span>客户管理</span>
          </el-menu-item>
          <el-menu-item v-if="user.role === 'admin'" index="users" @click="navigate('users')">
            <el-icon><Setting /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="accountSets" @click="navigate('accountSets')">
            <el-icon><Document /></el-icon>
            <span>账套管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header class="header">
          <div class="user-info">
            <span>欢迎, {{ user.name }} ({{ user.role === 'admin' ? '管理员' : '用户' }})</span>
            <el-button type="text" @click="logout">退出</el-button>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <!-- 动态组件渲染 -->
          <component :is="currentComponent" :user="user" />
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
        <div style="color: #666; font-size: 12px; margin-top: 20px;">
          默认账号: admin / admin123
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from 'vue';
import { ElMessage } from 'element-plus';
import {
  User,
  Document,
  Setting
} from '@element-plus/icons-vue';

// 导入组件
import Customers from './views/Customers.vue';
import Users from './views/Users.vue';
import AccountSets from './views/AccountSets.vue';

const user = ref(null);
const activeMenu = ref('customers'); // 默认激活客户管理
const loginForm = ref({ username: '', password: '' });

// 定义路由组件映射
const routes = {
  customers: markRaw(Customers),
  users: markRaw(Users),
  accountSets: markRaw(AccountSets)
};

// 当前组件
const currentComponent = ref(routes.customers); // 默认显示客户管理

// 导航函数
const navigate = (route) => {
  activeMenu.value = route;
  if (routes[route]) {
    currentComponent.value = routes[route];
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
    } else {
      ElMessage.error(data.error);
    }
  } catch (error) {
    console.error('登录失败:', error);
    ElMessage.error('登录失败，请检查网络连接');
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
</script>

<style>
/* 样式保持不变 */
</style>