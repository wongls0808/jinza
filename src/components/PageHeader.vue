<template>
  <div class="page-header">
    <div class="left">
      <div v-if="back" class="back-btn" @click="goBack">
        <el-icon><Back /></el-icon>
      </div>
      <h2 class="title">{{ title }}</h2>
      <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
    </div>
    <div class="right">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Back } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  title: string;
  subtitle?: string;
  back?: boolean;
}>();

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.left {
  display: flex;
  align-items: center;
}

.back-btn {
  margin-right: 10px;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}

.back-btn:hover {
  background-color: #f0f2f5;
}

.title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.5;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.right {
  display: flex;
  align-items: center;
}
</style>