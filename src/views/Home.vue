<template>
  <div class="home-container">
    <h1>欢迎来到 Jinza 管理系统</h1>
    <el-button type="primary" @click="goToDashboard">进入系统</el-button>
    <el-button type="info" @click="goToLogin">登录</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goToDashboard = () => {
  router.push('/dashboard');
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 20px;
}

h1 {
  font-size: 2.5rem;
  color: #409EFF;
  margin-bottom: 2rem;
}

.el-button {
  min-width: 120px;
}
</style>