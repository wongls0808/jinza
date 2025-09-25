<template>
  <div class="deployment-test-container">
    <h1>Jinza管理系统部署测试</h1>
    
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <h2>前端部署测试</h2>
        </div>
      </template>
      <div class="status-item">
        <span>前端状态:</span>
        <el-tag type="success">正常</el-tag>
      </div>
      <div class="info-item">
        <span>部署环境:</span>
        <span>{{ env }}</span>
      </div>
      <div class="info-item">
        <span>Vue版本:</span>
        <span>{{ vueVersion }}</span>
      </div>
      <div class="info-item">
        <span>API基础URL:</span>
        <span>{{ apiBaseUrl }}</span>
      </div>
    </el-card>
    
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <h2>后端连接测试</h2>
        </div>
      </template>
      <div class="test-actions">
        <el-button type="primary" @click="testBackendConnection" :loading="loading">
          测试后端连接
        </el-button>
        <el-button type="info" @click="testLoginApi" :loading="loginLoading">
          测试登录API
        </el-button>
      </div>
      
      <div v-if="backendTestResult" class="test-result">
        <h3>后端健康检查结果:</h3>
        <el-alert
          :title="backendTestResult.success ? '连接成功' : '连接失败'"
          :type="backendTestResult.success ? 'success' : 'error'"
          :description="backendTestResult.message"
          show-icon
        />
        <pre v-if="backendTestResult.data" class="result-data">{{ JSON.stringify(backendTestResult.data, null, 2) }}</pre>
      </div>
      
      <div v-if="loginTestResult" class="test-result">
        <h3>登录API测试结果:</h3>
        <el-alert
          :title="loginTestResult.success ? '调用成功' : '调用失败'"
          :type="loginTestResult.success ? 'success' : 'error'"
          :description="loginTestResult.message"
          show-icon
        />
        <pre v-if="loginTestResult.data" class="result-data">{{ JSON.stringify(loginTestResult.data, null, 2) }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get, post } from '@/utils/request';
import axios from 'axios';

const env = import.meta.env.MODE;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const vueVersion = ref('');

const loading = ref(false);
const loginLoading = ref(false);
interface TestResult {
  success: boolean;
  message: string;
  data: any;
}

const backendTestResult = ref<TestResult | null>(null);
const loginTestResult = ref<TestResult | null>(null);

// 获取Vue版本
onMounted(() => {
  // @ts-ignore
  vueVersion.value = Vue.version;
});

// 测试后端连接
const testBackendConnection = async () => {
  loading.value = true;
  backendTestResult.value = null;
  
  try {
    // 直接使用axios发起请求，避免request.ts中的拦截器处理
    // 尝试多种可能的健康检查路径
    let response;
    let endpoint = '';
    
    try {
      endpoint = '/health';
      response = await axios.get(`${apiBaseUrl}${endpoint}`);
    } catch (e) {
      try {
        endpoint = '/api/health';
        response = await axios.get(`${apiBaseUrl}${endpoint}`);
      } catch (e) {
        endpoint = '/';
        response = await axios.get(`${apiBaseUrl}${endpoint}`);
      }
    }
    
    backendTestResult.value = {
      success: true,
      message: `成功连接到后端服务 (${endpoint})`,
      data: response.data
    };
  } catch (err: any) {
    console.error('后端连接测试失败:', err);
    backendTestResult.value = {
      success: false,
      message: `连接失败: ${err.message || '未知错误'}`,
      data: null
    };
  } finally {
    loading.value = false;
  }
};

// 测试登录API
const testLoginApi = async () => {
  loginLoading.value = true;
  loginTestResult.value = null;
  
  try {
    // 使用预设的管理员账号
    // 尝试多种可能的登录路径
    let response;
    let endpoint = '';
    
    try {
      endpoint = '/api/login';
      response = await axios.post(`${apiBaseUrl}${endpoint}`, {
        username: 'admin',
        password: 'admin123'
      });
    } catch (e) {
      endpoint = '/login';
      response = await axios.post(`${apiBaseUrl}${endpoint}`, {
        username: 'admin',
        password: 'admin123'
      });
    }
    
    loginTestResult.value = {
      success: true,
      message: '成功调用登录API',
      data: {
        code: response.data.code,
        message: response.data.message,
        user: response.data.data?.user ? {
          username: response.data.data.user.username,
          role: response.data.data.user.role
        } : null,
        hasToken: !!response.data.data?.token
      }
    };
  } catch (err: any) {
    console.error('登录API测试失败:', err);
    loginTestResult.value = {
      success: false,
      message: `调用失败: ${err.message || '未知错误'}`,
      data: err.response?.data || null
    };
  } finally {
    loginLoading.value = false;
  }
};
</script>

<style scoped>
.deployment-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-item, .info-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.status-item span, .info-item span:first-child {
  width: 120px;
  font-weight: bold;
}

.test-actions {
  margin-bottom: 20px;
}

.test-result {
  margin-top: 20px;
  border-top: 1px solid #eaeaea;
  padding-top: 10px;
}

.result-data {
  margin-top: 10px;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>