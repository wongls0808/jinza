<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Jinza管理系统</h2>
      <el-form ref="loginForm" :model="loginForm" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%;">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
};

const handleLogin = () => {
  loading.value = true;
  
  // 模拟登录请求
  setTimeout(() => {
    loading.value = false;
    
    // 这里只是模拟，实际项目中应该调用API进行验证
    if (loginForm.username === 'admin' && loginForm.password === '123456') {
      // 保存登录状态
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify({ username: loginForm.username }));
      
      ElMessage.success('登录成功');
      
      // 如果有重定向，则重定向到指定页面，否则进入控制台
      const redirectPath = route.query.redirect ? route.query.redirect.toString() : '/dashboard';
      router.replace(redirectPath);
    } else {
      ElMessage.error('用户名或密码错误');
    }
  }, 1000);
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}

.login-form {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #409EFF;
  font-size: 24px;
}
</style>