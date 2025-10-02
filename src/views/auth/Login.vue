<template>
  <div class="login-wrapper">
    <div class="brand">
      <div class="icon">📊</div>
      <h1>企业管理系统</h1>
      <p class="subtitle">高效 · 安全 · 可扩展</p>
    </div>
    <el-card class="login-card" shadow="hover">
      <el-form @submit.prevent="onSubmit" :model="form" size="large">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" autofocus />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="full" :loading="loading" @click="onSubmit">{{ loading ? '登录中...' : '登录' }}</el-button>
        </el-form-item>
        <el-alert v-if="error" :title="error" type="error" show-icon closable @close="error=''" />
      </el-form>
      <div class="demo">演示: admin / admin123</div>
    </el-card>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useAuth } from '../../stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';

const auth = useAuth();
const route = useRoute();
const router = useRouter();

const form = ref({ username: '', password: '' });
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码';
    return; 
  }
  loading.value = true;
  error.value = '';
  try {
    await auth.login(form.value.username, form.value.password);
    const redirect = route.query.redirect || '/dashboard';
    router.replace(redirect);
  } catch (e) {
    error.value = e.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>
<style scoped>
.login-wrapper {min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;background:radial-gradient(circle at 30% 30%,#5a67d8,#434190);color:#fff;}
.brand {text-align:center;margin-bottom:32px;}
.icon {font-size:56px;margin-bottom:8px;}
.subtitle {margin:4px 0 0;font-size:14px;opacity:.85;}
.login-card {width:380px;border-radius:18px;}
.full {width:100%;}
.demo {margin-top:12px;font-size:12px;color:#666;text-align:center;}
</style>
