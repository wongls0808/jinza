<template>
  <div style="padding:40px; max-width:800px; margin:0 auto; text-align:center">
    <h1>后端连通性测试</h1>
    <p>尝试不同方法（GET/POST）与路径（/ping 或 /api/ping），并显示完整错误信息以便诊断。</p>
    <div style="margin-bottom:12px">
      <el-button type="primary" @click="pingGet" :loading="loadingGet">GET /ping</el-button>
      <el-button type="primary" @click="pingPost" :loading="loadingPost" style="margin-left:8px">POST /ping</el-button>
    </div>

    <div style="margin-top:20px; text-align:left; max-width:900px; margin-left:auto; margin-right:auto;">
      <div v-if="log.length">
        <h3>请求日志</h3>
        <ul>
          <li v-for="(l, idx) in log" :key="idx"><code>{{ l }}</code></li>
        </ul>
      </div>

      <div v-if="result">
        <h3>响应</h3>
        <pre>{{ result }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { get, post } from '@/utils/request';
import { ElMessage } from 'element-plus';

const loadingGet = ref(false);
const loadingPost = ref(false);
const result = ref<string | null>(null);
const log = ref<string[]>([]);

const pushLog = (s: string) => {
  log.value.unshift(`${new Date().toISOString()} - ${s}`);
  if (log.value.length > 20) log.value.pop();
};

const showError = (e: any) => {
  // Try to extract axios error fields
  const status = e?.response?.status;
  const data = e?.response?.data;
  const url = e?.config ? `${e.config.baseURL || ''}${e.config.url || ''}` : e?.request?.responseURL || 'unknown';
  const msg = e?.message || '请求失败';
  pushLog(`ERROR ${status || 'N/A'} ${url} - ${msg}`);
  result.value = JSON.stringify({ status, url, data, message: msg }, null, 2);
};

const pingGet = async () => {
  loadingGet.value = true;
  result.value = null;
  try {
    pushLog('Attempting GET /ping');
    const r = await get('/ping');
    pushLog('GET /ping success');
    result.value = JSON.stringify(r, null, 2);
  } catch (e: any) {
    showError(e);
    ElMessage.error(e?.message || 'GET 请求失败');
  } finally {
    loadingGet.value = false;
  }
};

const pingPost = async () => {
  loadingPost.value = true;
  result.value = null;
  try {
    pushLog('Attempting POST /ping');
    const r = await post('/ping');
    pushLog('POST /ping success');
    result.value = JSON.stringify(r, null, 2);
  } catch (e: any) {
    showError(e);
    ElMessage.error(e?.message || 'POST 请求失败');
  } finally {
    loadingPost.value = false;
  }
};
</script>
