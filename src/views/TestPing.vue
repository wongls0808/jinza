<template>
  <div style="padding:40px; max-width:800px; margin:0 auto; text-align:center">
    <h1>后端连通性测试</h1>
    <p>点击下方按钮向后端发送 /api/ping 请求（或 /ping，取决于后端）</p>
    <el-button type="primary" @click="ping" :loading="loading">发送请求</el-button>
    <div style="margin-top:20px" v-if="result">
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { post } from '@/utils/request';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const result = ref<string | null>(null);

const ping = async () => {
  loading.value = true;
  result.value = null;
  try {
    // 尝试 /ping 与 /api/ping 两种形式
    const r = await post('/ping');
    result.value = JSON.stringify(r, null, 2);
  } catch (err: any) {
    try {
      const r2 = await post('/api/ping');
      result.value = JSON.stringify(r2, null, 2);
    } catch (e: any) {
      ElMessage.error(e?.message || '请求失败');
      result.value = `Error: ${e?.message || String(e)}`;
    }
  } finally {
    loading.value = false;
  }
};
</script>
