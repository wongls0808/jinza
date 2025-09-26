<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Jinza多账套管理系统</h2>
      <el-form ref="loginForm" :model="loginForm" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
        
        <!-- 账套选择，仅在第二步显示 -->
        <el-form-item v-if="step === 2" label="请选择账套" prop="tenantId">
          <el-select v-model="loginForm.tenantId" placeholder="请选择账套" class="w-full">
            <el-option 
              v-for="tenant in tenantList" 
              :key="tenant.id" 
              :label="tenant.name" 
              :value="tenant.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" :disabled="loading" class="w-full">
            {{ step === 1 ? '登录' : '进入系统' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import type { Tenant, LoginForm as LoginFormType } from '@/types/system';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
// 登录步骤：1-输入用户名密码，2-选择账套
const step = ref(1);
const tenantList = ref<Tenant[]>([]);

const loginForm = reactive<LoginFormType>({
  username: '',
  password: '',
  remember: false,
  tenantId: undefined
});

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  tenantId: [
    { required: true, message: '请选择账套', trigger: 'change' }
  ]
};

const handleLogin = async () => {
  loading.value = true;
  
  try {
    // 第一步：验证用户名和密码
    if (step.value === 1) {
      // 调用登录接口，不传账套ID
      const res = await userStore.loginAction(loginForm);
      
      // 如果用户有多个账套，进入第二步选择账套
      if (res.tenants && res.tenants.length > 1) {
        tenantList.value = res.tenants;
        step.value = 2; // 进入账套选择
      } else if (res.tenants && res.tenants.length === 1 && res.tenants[0]) {
        // 只有一个账套，直接使用
        loginForm.tenantId = res.tenants[0].id;
        await completeLogin();
      } else {
        // 没有可用账套
        ElMessage.error('您没有可用的账套，请联系管理员');
      }
    } else {
      // 第二步：已选择账套，完成登录
      await completeLogin();
    }
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败');
  } finally {
    loading.value = false;
  }
};

// 完成登录过程
const completeLogin = async () => {
  try {
    // 如果有选择账套，则切换到该账套
    if (loginForm.tenantId && userStore.user) {
      await userStore.switchTenantAction(Number(loginForm.tenantId));
    }
    
    ElMessage.success('登录成功');
    
    // 如果有重定向，则重定向到指定页面，否则进入控制台
    const redirectPath = route.query.redirect ? route.query.redirect.toString() : '/dashboard';
    router.replace(redirectPath);
  } catch (error: any) {
    ElMessage.error(error.message || '切换账套失败');
  }
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